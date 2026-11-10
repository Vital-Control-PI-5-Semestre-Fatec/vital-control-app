import { isRunningInExpoGo } from 'expo';
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes, type NotificationTriggerInput } from 'expo-notifications/build/Notifications.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { Platform } from 'react-native';
import type { ApiSchedule } from '../../features/patient/api-types';

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await getPermissionsAsync();

  if (existing === 'granted') return true;

  const { status } = await requestPermissionsAsync();
  return status === 'granted';
}

export async function getPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;
    if (Platform.OS === 'android' && isRunningInExpoGo()) return null;

    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const { getExpoPushTokenAsync } = await import('expo-notifications/build/getExpoPushTokenAsync');
    const token = await getExpoPushTokenAsync();
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
): NotificationTriggerInput {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  if (recurrence.type === 'DAILY') {
    return { type: SchedulableTriggerInputTypes.DAILY, hour, minute };
  }

  if (recurrence.type === 'WEEKDAYS' && recurrence.weekdays && recurrence.weekdays.length > 0) {
    return {
      type: SchedulableTriggerInputTypes.WEEKLY,
      weekday: (recurrence.weekdays[0]! % 7) + 1,
      hour,
      minute,
    };
  }

  if (recurrence.type === 'INTERVAL_DAYS') {
    const seconds = (recurrence.intervalDays ?? 1) * 24 * 60 * 60;
    return { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: true };
  }

  return { type: SchedulableTriggerInputTypes.DAILY, hour, minute };
}

export async function scheduleAlarmsForSchedule(schedule: ApiSchedule): Promise<void> {
  if (!schedule.active) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  for (const time of schedule.times) {
    const trigger = buildTriggerForTime(time, schedule.recurrence);
    if (!trigger) continue;

    await scheduleNotificationAsync({
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
  const scheduled = await getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith(`schedule-${scheduleId}-`)) {
      await cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function syncAllAlarms(schedules: ApiSchedule[]): Promise<void> {
  await cancelAllScheduledNotificationsAsync();

  for (const schedule of schedules) {
    if (schedule.active) {
      await scheduleAlarmsForSchedule(schedule);
    }
  }
}
