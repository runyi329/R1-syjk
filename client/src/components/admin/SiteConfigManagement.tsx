import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function SiteConfigManagement() {
  const [logoUrl, setLogoUrl] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: config } = trpc.siteConfig.getConfig.useQuery();
  const updateConfigMutation = trpc.siteConfig.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("网站配置已更新");
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "更新失败");
      setIsSaving(false);
    },
  });

  // 初始化表单数据
  useEffect(() => {
    if (config) {
      setLogoUrl(config.logoUrl || "/logo.png");
      setSiteTitle(config.siteTitle || "数金研投");
      setSiteDescription(config.siteDescription || "RUNYI INVESTMENT");
      setLogoPreview(config.logoUrl || "/logo.png");
      setIsLoading(false);
    }
  }, [config]);

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setLogoUrl(url);
    // 实时预览
    if (url) {
      setLogoPreview(url);
    }
  };

  const handleSave = async () => {
    if (!logoUrl) {
      toast.error("请输入 Logo URL");
      return;
    }

    setIsSaving(true);
    try {
      await updateConfigMutation.mutateAsync({
        logoUrl,
        siteTitle,
        siteDescription,
      });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-[#D4AF37]">网站配置</CardTitle>
          <CardDescription>管理网站全局配置，如 Logo 和标题</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo 配置 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="text-white">
                Logo 图片 URL
              </Label>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={handleLogoUrlChange}
                className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/60">
                输入 Logo 图片的完整 URL 地址
              </p>
            </div>

            {/* Logo 预览 */}
            {logoPreview && (
              <div className="space-y-2">
                <Label className="text-white">Logo 预览</Label>
                <div className="flex items-center justify-center p-4 bg-black/30 rounded-lg border border-white/10">
                  <img
                    src={logoPreview}
                    alt="Logo 预览"
                    className="h-16 w-16 object-contain"
                    onError={() => {
                      toast.error("无法加载图片，请检查 URL 是否正确");
                      setLogoPreview("");
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 网站标题 */}
          <div className="space-y-2">
            <Label htmlFor="siteTitle" className="text-white">
              网站标题
            </Label>
            <Input
              id="siteTitle"
              placeholder="数金研投"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* 网站描述 */}
          <div className="space-y-2">
            <Label htmlFor="siteDescription" className="text-white">
              网站描述
            </Label>
            <Textarea
              id="siteDescription"
              placeholder="RUNYI INVESTMENT"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
          </div>

          {/* 保存按钮 */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C158] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存配置"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 配置说明 */}
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-[#D4AF37] text-sm">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/70 space-y-2">
          <p>• Logo 图片 URL 需要是完整的网络地址（http:// 或 https://）</p>
          <p>• 修改后的配置会立即应用到首页和管理员后台</p>
          <p>• 支持的图片格式：PNG、JPG、GIF、SVG 等</p>
          <p>• 建议 Logo 尺寸：正方形，最小 40x40 像素</p>
        </CardContent>
      </Card>
    </div>
  );
}
