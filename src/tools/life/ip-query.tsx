"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, RefreshCw, Globe, MapPin, Wifi } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface IpInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_name: string;
  latitude: number;
  longitude: number;
  isp: string;
  org: string;
  timezone: string;
  postal: string;
  asn: string;
}

export function IpQueryTool() {
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchIpInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("请求失败");
      setIpInfo(await response.json());
    } catch {
      setError("获取 IP 信息失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIpInfo(); }, []);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">正在获取 IP 信息...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchIpInfo} size="sm"><RefreshCw className="h-4 w-4 mr-1" /> 重试</Button>
        </CardContent>
      </Card>
    );
  }

  if (!ipInfo) return null;

  const infoItems = [
    { label: "IP 地址", value: ipInfo.ip, Icon: Globe, key: "ip" },
    { label: "城市", value: ipInfo.city, Icon: MapPin, key: "city" },
    { label: "地区", value: ipInfo.region, Icon: MapPin, key: "region" },
    { label: "国家", value: ipInfo.country_name, Icon: MapPin, key: "country" },
    { label: "经纬度", value: `${ipInfo.latitude}, ${ipInfo.longitude}`, Icon: MapPin, key: "coords" },
    { label: "ISP", value: ipInfo.isp, Icon: Wifi, key: "isp" },
    { label: "组织", value: ipInfo.org, Icon: Wifi, key: "org" },
    { label: "ASN", value: ipInfo.asn, Icon: Wifi, key: "asn" },
    { label: "时区", value: ipInfo.timezone, Icon: Globe, key: "timezone" },
    { label: "邮编", value: ipInfo.postal, Icon: MapPin, key: "postal" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={fetchIpInfo} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> 刷新</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoItems.map((item) => (
          <Card key={item.key}>
            <CardContent className="p-3 flex items-center gap-3">
              <item.Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value || "—"}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy(String(item.value || ""), item.key)}>
                {copiedKey === item.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
