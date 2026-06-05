import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ApiSchedule } from '../../features/patient/api-types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getPushToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    if (Platform.OS === 'web') return null;

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

function weekdayLabel(day: number): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[day] ?? '';
}

function buildTriggerForTime(
  time: string,
  recurrence: ApiSchedule['recurrence'],
): Notifications.NotificationTriggerInput | null {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  if (recurrence.type === 'DAILY') {
    return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute };
  }

  if (recurrence.type === 'WEEKDAYS' && recurrence.weekdays && recurrence.weekdays.length > 0) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: (recurrence.weekdays[0]! % 7) + 1,
      hour,
      minute,
    };
  }

  if (recurrence.type === 'INTERVAL_DAYS') {
    const seconds = (recurrence.intervalDays ?? 1) * 24 * 60 * 60;
    return { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: true };
  }

  return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute };
}

export async function scheduleAlarmsForSchedule(schedule: ApiSchedule): Promise<void> {
  if (!schedule.active) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  for (const time of schedule.times) {
    const trigger = buildTriggerForTime(time, schedule.recurrence);
    if (!trigger) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `schedule-${schedule._id}-${time}`,
      content: {
        title: '💊 Hora do medicamento',
        body: `${schedule.title} — ${time}`,
        data: { scheduleId: schedule._id },
      },
      trigger,
    });
  }
}

export async function cancelAlarmsForSchedule(scheduleId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith(`schedule-${scheduleId}-`)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function syncAllAlarms(schedules: ApiSchedule[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const schedule of schedules) {
    if (schedule.active) {
      await scheduleAlarmsForSchedule(schedule);
    }
  }
}
