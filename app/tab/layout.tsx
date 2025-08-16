import { SettingsProvider } from '../settings-context'
import { ConfigProvider } from '../config-context'
import '../globals.css'
import { Toaster } from '@/components/ui/toaster'

export default function TabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsProvider>
      <ConfigProvider>
        {children}
        <Toaster />
      </ConfigProvider>
    </SettingsProvider>
  )
}