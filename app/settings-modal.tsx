import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSettings } from './settings-context'
import { Button } from "@/components/ui/button"

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings when the global settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setLocalSettings({
      ...localSettings,
      [field]: value
    });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

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
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              value={localSettings.apiUrl}
              onChange={(e) => handleInputChange('apiUrl', e.target.value)}
              placeholder="Enter API URL (e.g. http://gtsdb-web.abby.md)"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-visualization" className="flex flex-col space-y-1">
              <span>Show Data Visualization</span>
              <span className="font-normal text-sm text-muted-foreground">
                Display charts for data visualization
              </span>
            </Label>
            <Switch
              id="show-visualization"
              checked={localSettings.showVisualization}
              onCheckedChange={(checked) => handleInputChange('showVisualization', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-request" className="flex flex-col space-y-1">
              <span>Show Request Payload</span>
              <span className="font-normal text-sm text-muted-foreground">
                Display request payload information
              </span>
            </Label>
            <Switch
              id="show-request"
              checked={localSettings.showRequest}
              onCheckedChange={(checked) => handleInputChange('showRequest', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostname">GTSDB Hostname</Label>
            <Input
              id="hostname"
              value={localSettings.hostname}
              onChange={(e) => handleInputChange('hostname', e.target.value)}
              placeholder="Enter hostname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">GTSDB Port</Label>
            <Input
              id="port"
              value={localSettings.port}
              onChange={(e) => handleInputChange('port', e.target.value)}
              placeholder="Enter port number"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}