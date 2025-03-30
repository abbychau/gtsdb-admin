import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSettings } from './settings-context'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useConfig } from './config-context'

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
  onSave: (newApiUrl: string) => void;
}

function ConfigureModal({ isOpen, onClose, apiUrl, onSave }: ConfigureModalProps) {
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [configData, setConfigData] = useState('{}');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { updateConfig } = useConfig();

  useEffect(() => {
    setLocalApiUrl(apiUrl);
    // Only fetch config when modal is open and apiUrl exists
    if (isOpen && apiUrl) {
      fetchCurrentConfig();
    }
    // Reset config data when modal closes
    if (!isOpen) {
      setConfigData('{}');
    }
  }, [apiUrl, isOpen]);

  const fetchCurrentConfig = async () => {
    if (!apiUrl) return;
    
    setIsLoading(true);
    try {
      // Use query parameter for apiUrl instead of header
      const response = await fetch(`/api/tsdb?apiUrl=${encodeURIComponent(apiUrl)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation: 'getapiurlconfig' })
      });
      
      const result = await response.json();
      if (result.success) {
        setConfigData(JSON.stringify(result.data, null, 2) || '{}');
      } else {
        toast({
          title: "Error fetching configuration",
          description: result.message || "Failed to load configuration",
          variant: "destructive"
        });
        setConfigData('{}');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive"
      });
      setConfigData('{}');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    
    try {
      // Validate JSON
      let configObj;
      try {
        configObj = JSON.parse(configData);
        // Update local config context immediately
        updateConfig(configObj);
      } catch (e) {
        toast({
          title: "Invalid JSON",
          description: "Please enter valid JSON configuration",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Use query parameter for apiUrl instead of header
      const response = await fetch(`/api/tsdb?apiUrl=${encodeURIComponent(apiUrl)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'setapiurlconfig',
          config: configObj
        })
      });
      
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Configuration saved",
          description: "API configuration has been updated successfully",
        });
        onSave(localApiUrl);
      } else {
        toast({
          title: "Error saving configuration",
          description: result.message || "Failed to save configuration",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Endpoint Multipliers and Units</DialogTitle>
          <DialogDescription>
            Configure your GTSDB API connection including multipliers, units, offsets, and hints
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="configApiUrl">Configure Json</Label>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px] border rounded-md">
                <div className="text-sm text-muted-foreground">Loading configuration...</div>
              </div>
            ) : (
              <textarea
                id="configApiUrl"
                className="w-full min-h-[300px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ fontFamily: 'monospace' }}
                value={configData}
                onChange={(e) => setConfigData(e.target.value)}
                placeholder="JSON configuration"
              />
            )}
            <p className="text-sm text-muted-foreground">
              Enter configuration in JSON format for multipliers, units, offsets, and hints
            </p>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => onClose()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Configuration And Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);

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

  const handleApiConfigSave = (newApiUrl: string) => {
    handleInputChange('apiUrl', newApiUrl);
    setConfigureModalOpen(false);
  };

  return (
    <>
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
              
              <Button
                variant="outline"
                onClick={() => {
                  setConfigureModalOpen(true);
                }}
              >
                Configure
              </Button>
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

      <ConfigureModal
        isOpen={configureModalOpen}
        onClose={() => setConfigureModalOpen(false)}
        apiUrl={localSettings.apiUrl}
        onSave={handleApiConfigSave}
      />
    </>
  );
}