import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSettings } from './settings-context'


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your GTSDB preferences
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-visualization" className="flex flex-col space-y-1">
              <span>Show Data Visualization</span>
              <span className="font-normal text-sm text-muted-foreground">
                Display charts for data visualization
              </span>
            </Label>
            <Switch
              id="show-visualization"
              checked={settings.showVisualization}
              onCheckedChange={(checked) => {
                updateSettings({ showVisualization: checked })
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-request" className="flex flex-col space-y-1">
              <span>Show Request Data</span>
              <span className="font-normal text-sm text-muted-foreground">
                Display request payload information
              </span>
            </Label>
            <Switch
              id="show-request"
              checked={settings.showRequest}
              onCheckedChange={(checked) => updateSettings({ showRequest: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostname">GTSDB Hostname</Label>
            <Input
              id="hostname"
              value={settings.hostname}
              onChange={(e) => updateSettings({ hostname: e.target.value })}
              placeholder="Enter hostname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">GTSDB Port</Label>
            <Input
              id="port"
              value={settings.port}
              onChange={(e) => updateSettings({ port: e.target.value })}
              placeholder="Enter port number"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}