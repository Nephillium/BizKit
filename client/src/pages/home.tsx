import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, FileText, ScrollText, Share2, Copy, Check, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Tool = "cold_email" | "proposal" | "contract" | "social_pack";

interface GenerateResponse {
  ok: boolean;
  output?: string;
  error?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tool>("cold_email");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Cold Email form state
  const [coldEmail, setColdEmail] = useState({
    target: "",
    service: "",
    tone: "",
    language: "English",
  });

  // Proposal form state
  const [proposal, setProposal] = useState({
    clientType: "",
    projectScope: "",
    deliverables: "",
    budgetRange: "",
    language: "English",
  });

  // Contract form state
  const [contract, setContract] = useState({
    clientName: "",
    providerName: "",
    serviceDescription: "",
    paymentTerms: "",
    jurisdiction: "",
    language: "English",
  });

  // Social Pack form state
  const [socialPack, setSocialPack] = useState({
    businessType: "",
    niche: "",
    tone: "",
    platform: "",
    language: "English",
  });

  const tabs = [
    { id: "cold_email" as Tool, label: "Cold Email", icon: Mail },
    { id: "proposal" as Tool, label: "Proposal", icon: FileText },
    { id: "contract" as Tool, label: "Contract", icon: ScrollText },
    { id: "social_pack" as Tool, label: "Social Pack", icon: Share2 },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setOutput("");

    let inputs: Record<string, string> = {};

    switch (activeTab) {
      case "cold_email":
        inputs = coldEmail;
        break;
      case "proposal":
        inputs = proposal;
        break;
      case "contract":
        inputs = contract;
        break;
      case "social_pack":
        inputs = socialPack;
        break;
    }

    try {
      const res = await apiRequest("POST", "/api/generate", {
        tool: activeTab,
        inputs,
      });

      const response = await res.json() as GenerateResponse;

      if (response.ok && response.output) {
        setOutput(response.output);
      } else {
        setError(response.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderColdEmailForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="target" className="text-sm font-medium">
          Target Audience
        </Label>
        <Input
          id="target"
          data-testid="input-cold-email-target"
          placeholder="e.g. clinic owners in Istanbul"
          value={coldEmail.target}
          onChange={(e) => setColdEmail({ ...coldEmail, target: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="service" className="text-sm font-medium">
          Service You Offer
        </Label>
        <Input
          id="service"
          data-testid="input-cold-email-service"
          placeholder="e.g. Google Ads management"
          value={coldEmail.service}
          onChange={(e) => setColdEmail({ ...coldEmail, service: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tone" className="text-sm font-medium">
          Tone
        </Label>
        <Input
          id="tone"
          data-testid="input-cold-email-tone"
          placeholder="friendly, professional, casual"
          value={coldEmail.tone}
          onChange={(e) => setColdEmail({ ...coldEmail, tone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="language" className="text-sm font-medium">
          Language
        </Label>
        <Input
          id="language"
          data-testid="input-cold-email-language"
          placeholder="English"
          value={coldEmail.language}
          onChange={(e) => setColdEmail({ ...coldEmail, language: e.target.value })}
        />
      </div>
    </div>
  );

  const renderProposalForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientType" className="text-sm font-medium">
          Client Type
        </Label>
        <Input
          id="clientType"
          data-testid="input-proposal-client-type"
          placeholder="e-commerce brand, SaaS founder, etc."
          value={proposal.clientType}
          onChange={(e) => setProposal({ ...proposal, clientType: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectScope" className="text-sm font-medium">
          Project Scope
        </Label>
        <Textarea
          id="projectScope"
          data-testid="input-proposal-scope"
          placeholder="Describe the project scope..."
          className="min-h-24 resize-y"
          value={proposal.projectScope}
          onChange={(e) => setProposal({ ...proposal, projectScope: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="deliverables" className="text-sm font-medium">
          Deliverables
        </Label>
        <Textarea
          id="deliverables"
          data-testid="input-proposal-deliverables"
          placeholder="List the deliverables..."
          className="min-h-24 resize-y"
          value={proposal.deliverables}
          onChange={(e) => setProposal({ ...proposal, deliverables: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="budgetRange" className="text-sm font-medium">
          Budget Range
        </Label>
        <Input
          id="budgetRange"
          data-testid="input-proposal-budget"
          placeholder="$2,000 - $5,000"
          value={proposal.budgetRange}
          onChange={(e) => setProposal({ ...proposal, budgetRange: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="proposalLanguage" className="text-sm font-medium">
          Language
        </Label>
        <Input
          id="proposalLanguage"
          data-testid="input-proposal-language"
          placeholder="English"
          value={proposal.language}
          onChange={(e) => setProposal({ ...proposal, language: e.target.value })}
        />
      </div>
    </div>
  );

  const renderContractForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientName" className="text-sm font-medium">
          Client Name
        </Label>
        <Input
          id="clientName"
          data-testid="input-contract-client"
          placeholder="Client's full name or company"
          value={contract.clientName}
          onChange={(e) => setContract({ ...contract, clientName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="providerName" className="text-sm font-medium">
          Provider Name (You)
        </Label>
        <Input
          id="providerName"
          data-testid="input-contract-provider"
          placeholder="Your name or company"
          value={contract.providerName}
          onChange={(e) => setContract({ ...contract, providerName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="serviceDescription" className="text-sm font-medium">
          Service Description
        </Label>
        <Textarea
          id="serviceDescription"
          data-testid="input-contract-service"
          placeholder="Describe the services to be provided..."
          className="min-h-24 resize-y"
          value={contract.serviceDescription}
          onChange={(e) => setContract({ ...contract, serviceDescription: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentTerms" className="text-sm font-medium">
          Payment Terms
        </Label>
        <Input
          id="paymentTerms"
          data-testid="input-contract-payment"
          placeholder="e.g. 50% upfront, 50% on delivery"
          value={contract.paymentTerms}
          onChange={(e) => setContract({ ...contract, paymentTerms: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jurisdiction" className="text-sm font-medium">
          Jurisdiction
        </Label>
        <Input
          id="jurisdiction"
          data-testid="input-contract-jurisdiction"
          placeholder="e.g. Turkey"
          value={contract.jurisdiction}
          onChange={(e) => setContract({ ...contract, jurisdiction: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractLanguage" className="text-sm font-medium">
          Language
        </Label>
        <Input
          id="contractLanguage"
          data-testid="input-contract-language"
          placeholder="English"
          value={contract.language}
          onChange={(e) => setContract({ ...contract, language: e.target.value })}
        />
      </div>
    </div>
  );

  const renderSocialPackForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="businessType" className="text-sm font-medium">
          Business Type
        </Label>
        <Input
          id="businessType"
          data-testid="input-social-business"
          placeholder="e.g. coffee shop, agency"
          value={socialPack.businessType}
          onChange={(e) => setSocialPack({ ...socialPack, businessType: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="niche" className="text-sm font-medium">
          Niche
        </Label>
        <Input
          id="niche"
          data-testid="input-social-niche"
          placeholder="e.g. specialty coffee, digital marketing"
          value={socialPack.niche}
          onChange={(e) => setSocialPack({ ...socialPack, niche: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="socialTone" className="text-sm font-medium">
          Tone
        </Label>
        <Input
          id="socialTone"
          data-testid="input-social-tone"
          placeholder="friendly, playful, educational"
          value={socialPack.tone}
          onChange={(e) => setSocialPack({ ...socialPack, tone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="platform" className="text-sm font-medium">
          Platform
        </Label>
        <Input
          id="platform"
          data-testid="input-social-platform"
          placeholder="Instagram, LinkedIn, X"
          value={socialPack.platform}
          onChange={(e) => setSocialPack({ ...socialPack, platform: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="socialLanguage" className="text-sm font-medium">
          Language
        </Label>
        <Input
          id="socialLanguage"
          data-testid="input-social-language"
          placeholder="English"
          value={socialPack.language}
          onChange={(e) => setSocialPack({ ...socialPack, language: e.target.value })}
        />
      </div>
    </div>
  );

  const renderActiveForm = () => {
    switch (activeTab) {
      case "cold_email":
        return renderColdEmailForm();
      case "proposal":
        return renderProposalForm();
      case "contract":
        return renderContractForm();
      case "social_pack":
        return renderSocialPackForm();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center space-y-4">
          <h1 
            className="text-4xl md:text-5xl font-bold tracking-tight"
            data-testid="text-hero-title"
          >
            BizKit AI
          </h1>
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            data-testid="text-hero-subtitle"
          >
            Client-Winning Content in Seconds
          </p>
          <p className="text-muted-foreground">
            Cold emails, proposals, contracts and social media posts for freelancers & agencies.
          </p>
          <Badge variant="secondary" className="mt-4" data-testid="badge-beta">
            Free beta - Pro plans coming soon
          </Badge>
        </section>

        {/* Main Content */}
        <section className="pb-16 md:pb-24">
          <Card className="overflow-visible">
            <CardContent className="p-6 md:p-8">
              {/* Tab Navigation */}
              <div className="grid grid-cols-2 md:flex md:flex-row gap-2 mb-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? "default" : "outline"}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setOutput("");
                        setError("");
                      }}
                      className="flex items-center gap-2 justify-center"
                      data-testid={`tab-${tab.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Active Form */}
              <div className="mb-8">
                {renderActiveForm()}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full md:w-auto min-w-48"
                size="lg"
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <div 
                  className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
                  data-testid="text-error"
                >
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {/* Output Display */}
              {output && (
                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Generated Content</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex items-center gap-2"
                      data-testid="button-copy"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={output}
                    className="min-h-64 font-mono text-sm bg-muted/50 resize-y"
                    data-testid="textarea-output"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="pb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by AI. Not legal or professional advice.
          </p>
        </footer>
      </div>
    </div>
  );
}
