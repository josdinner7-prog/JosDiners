import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'

// Configure status bar for branded native dark look
export async function setupRiderStatusBar() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#071A3D' })
  } catch (e) {
    // Ignore in unsupported environments
  }
}

// Trigger haptic vibration on button taps or alerts
export async function triggerHaptic(type = 'medium') {
  if (!Capacitor.isNativePlatform()) return
  try {
    if (type === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } else if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light })
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success })
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning })
    } else {
      await Haptics.impact({ style: ImpactStyle.Medium })
    }
  } catch (e) {
    // Ignore
  }
}

// Show local notification / sound alert on phone
export async function notifyRiderDevice({ title, body }) {
  triggerHaptic('warning')
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title || "Jo's Diner Dispatch Alert", {
          body: body || 'New delivery action required.',
          icon: '/logo.png'
        })
      } else if (Notification.permission !== 'denied') {
        const p = await Notification.requestPermission()
        if (p === 'granted') {
          new Notification(title || "Jo's Diner Dispatch Alert", {
            body: body || 'New delivery action required.',
            icon: '/logo.png'
          })
        }
      }
    } catch (e) {
      // Ignore
    }
  }
}
