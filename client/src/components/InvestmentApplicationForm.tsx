import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface InvestmentApplicationFormProps {
  productName?: string;
  minAmount?: number;
  triggerButtonText?: string;
}

export default function InvestmentApplicationForm({
  productName = "周周赢",
  minAmount = 1000,
  triggerButtonText = "立即投资"
}: InvestmentApplicationFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    investmentAmount: minAmount.toString(),
    investmentDuration: "6",
    walletAddress: "",
    riskTolerance: "medium",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("请输入您的姓名");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("请输入您的邮箱");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("请输入有效的邮箱地址");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("请输入您的电话号码");
      return false;
    }
    const amount = parseFloat(formData.investmentAmount);
    if (isNaN(amount) || amount < minAmount) {
      toast.error(`投资金额不能少于 ${minAmount} USDT`);
      return false;
    }
    if (!formData.walletAddress.trim()) {
      toast.error("请输入您的钱包地址");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      toast.success("投资申请已提交！我们的顾问将尽快与您联系");
      
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          investmentAmount: minAmount.toString(),
          investmentDuration: "6",
          walletAddress: "",
          riskTolerance: "medium",
          message: ""
        });
      }, 2000);
    } catch (error) {
      toast.error("提交失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{productName}投资申请</DialogTitle>
          <DialogDescription>
            填写以下信息提交您的投资申请，我们的专业团队将为您提供个性化的投资方案
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold">申请已提交成功！</h3>
            <p className="text-muted-foreground text-center">
              感谢您的信任，我们的投资顾问将在24小时内与您联系，为您详细介绍产品和投资方案。
            </p>
            <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4 w-full">
              <p className="text-sm text-blue-700">
                <strong>下一步：</strong>请保持您的手机和邮箱畅通，我们将通过电话或邮件与您沟通。
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="font-semibold">基本信息</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">姓名 *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="请输入您的姓名"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">电话号码 *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="请输入您的电话号码"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址 *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="请输入您的邮箱地址"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* 投资信息 */}
            <div className="space-y-4">
              <h3 className="font-semibold">投资信息</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investmentAmount">投资金额 (USDT) *</Label>
                  <Input
                    id="investmentAmount"
                    name="investmentAmount"
                    type="number"
                    placeholder={`最少 ${minAmount} USDT`}
                    value={formData.investmentAmount}
                    onChange={handleInputChange}
                    disabled={loading}
                    min={minAmount}
                  />
                  <p className="text-xs text-muted-foreground">
                    最低投资金额：{minAmount} USDT
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investmentDuration">投资期限</Label>
                  <Select value={formData.investmentDuration} onValueChange={(value) => handleSelectChange("investmentDuration", value)}>
                    <SelectTrigger id="investmentDuration" disabled={loading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3个月</SelectItem>
                      <SelectItem value="6">6个月</SelectItem>
                      <SelectItem value="12">12个月</SelectItem>
                      <SelectItem value="24">24个月</SelectItem>
                      <SelectItem value="36">36个月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletAddress">钱包地址 *</Label>
                <Input
                  id="walletAddress"
                  name="walletAddress"
                  placeholder="请输入您的数字钱包地址（用于接收收益）"
                  value={formData.walletAddress}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* 风险评估 */}
            <div className="space-y-4">
              <h3 className="font-semibold">风险承受能力</h3>
              
              <div className="space-y-2">
                <Label htmlFor="riskTolerance">您的风险承受能力</Label>
                <Select value={formData.riskTolerance} onValueChange={(value) => handleSelectChange("riskTolerance", value)}>
                  <SelectTrigger id="riskTolerance" disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">保守型 - 倾向于稳定收益</SelectItem>
                    <SelectItem value="medium">平衡型 - 追求收益与风险的平衡</SelectItem>
                    <SelectItem value="high">激进型 - 可承受较高风险</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-4">
              <h3 className="font-semibold">其他信息</h3>
              
              <div className="space-y-2">
                <Label htmlFor="message">备注（可选）</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="如有任何疑问或特殊需求，请在此说明"
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>

            {/* 风险提示 */}
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong className="text-yellow-600">重要提示：</strong></p>
                    <p>• 投资存在风险，过往收益不代表未来表现</p>
                    <p>• 请根据自身风险承受能力谨慎投资</p>
                    <p>• 提交申请即表示您已阅读并同意相关风险提示</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 提交按钮 */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "提交中..." : "提交申请"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
