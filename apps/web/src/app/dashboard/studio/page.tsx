"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  Wand2,
  Hash,
  Target,
  MessageSquare,
  Copy,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Tab = "generate" | "rewrite" | "expand" | "summarize" | "hashtags" | "hooks" | "cta";

export default function AIStudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | string[] | null>(null);
  const [resultType, setResultType] = useState<"text" | "list">("text");

  // Generate form state
  const [generateTopic, setGenerateTopic] = useState("");
  const [generatePlatform, setGeneratePlatform] = useState<"TWITTER" | "LINKEDIN" | "FACEBOOK" | "INSTAGRAM" | "THREADS">("TWITTER");
  const [generateTone, setGenerateTone] = useState<"professional" | "casual" | "funny" | "engaging" | "educational">("engaging");
  const [generateOptions, setGenerateOptions] = useState({
    includeHashtags: true,
    includeEmojis: true,
    includeCallToAction: false,
  });

  // Rewrite form state
  const [rewriteContent, setRewriteContent] = useState("");
  const [rewriteTone, setRewriteTone] = useState<"professional" | "casual" | "funny" | "engaging" | "educational">("professional");

  // Hashtags form state
  const [hashtagsContent, setHashtagsContent] = useState("");
  const [hashtagsCount, setHashtagsCount] = useState(10);

  // Hooks form state
  const [hooksContent, setHooksContent] = useState("");
  const [hooksCount, setHooksCount] = useState(5);

  // CTA form state
  const [ctaContext, setCtaContext] = useState("");
  const [ctaCount, setCtaCount] = useState(5);

  const handleGeneratePost = async () => {
    if (!generateTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    try {
      setLoading(true);

      // Demo mode - simulate API delay then generate demo content
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const demoContent = `🚀 Excited to share insights on ${generateTopic}!

In today's digital landscape, understanding ${generateTopic} is crucial for success. Here's what you need to know:

1️⃣ Stay informed about the latest trends
2️⃣ Adapt your strategy accordingly
3️⃣ Embrace continuous learning

What's your take on ${generateTopic}? Let me know in the comments! 💭

#${generateTopic.replace(/\s+/g, "")} #insights #socialmedia`;

      setResult(demoContent);
      setResultType("text");
      toast.success("Post generated! (Demo mode - Backend required for real AI)");
    } catch (error: any) {
      console.error("Generate error:", error);
      toast.info("Demo mode: Showing sample content");
      setResult(
        `Sample post about ${generateTopic} - Backend not configured yet`
      );
      setResultType("text");
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!rewriteContent.trim()) {
      toast.error("Please enter content to rewrite");
      return;
    }

    try {
      setLoading(true);

      // Demo mode
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const rewriteMap: { [key: string]: string } = {
        professional: "We are excited to present...",
        casual: "Hey, check this out...",
        funny: "Buckle up, this is hilarious...",
        engaging: "You won't believe this...",
        educational: "Let me teach you something valuable...",
      };

      const rewritten = `[${rewriteTone}] ${rewriteMap[rewriteTone]} ${rewriteContent.substring(0, 50)}...`;

      setResult(rewritten);
      setResultType("text");
      toast.success("Content rewritten! (Demo mode)");
    } catch (error: any) {
      toast.info("Demo mode: Showing rewritten sample");
      setResult(`Rewritten content in ${rewriteTone} tone`);
      setResultType("text");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!hashtagsContent.trim()) {
      toast.error("Please enter content");
      return;
    }

    try {
      setLoading(true);

      // Demo mode
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const hashtags = Array.from({ length: hashtagsCount }, (_, i) => {
        const topics = hashtagsContent.split(" ");
        const word = topics[i % topics.length];
        return `#${word.toLowerCase().replace(/[^a-z0-9]/g, "")}${i + 1}`;
      });

      setResult(hashtags);
      setResultType("list");
      toast.success("Hashtags generated! (Demo mode)");
    } catch (error: any) {
      toast.info("Demo mode: Showing sample hashtags");
      setResult(["#socialmedia", "#content", "#marketing", "#demo"]);
      setResultType("list");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHooks = async () => {
    if (!hooksContent.trim()) {
      toast.error("Please enter content");
      return;
    }

    try {
      setLoading(true);

      // Demo mode
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const demoHooks = [
        `🎯 Stop! You need to know this about ${hooksContent.split(" ")[0]}`,
        `⚡ This is the #1 mistake people make with ${hooksContent.split(" ")[0]}`,
        `💡 Here's what nobody tells you about ${hooksContent.split(" ")[0]}`,
        `🔥 The truth about ${hooksContent.split(" ")[0]} (revealed)`,
        `😲 Wait until you see what happens with ${hooksContent.split(" ")[0]}`,
      ];

      setResult(demoHooks.slice(0, hooksCount));
      setResultType("list");
      toast.success("Hooks generated! (Demo mode)");
    } catch (error: any) {
      toast.info("Demo mode: Showing sample hooks");
      setResult(["Did you know?", "Here's a secret...", "This will shock you"]);
      setResultType("list");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCTA = async () => {
    if (!ctaContext.trim()) {
      toast.error("Please enter context");
      return;
    }

    try {
      setLoading(true);

      // Demo mode
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const demoCTAs = [
        `Learn more →`,
        `Get started today →`,
        `Join us now →`,
        `Discover the difference →`,
        `Claim your spot →`,
        `See how it works →`,
        `Don't miss out →`,
        `Take action now →`,
      ];

      setResult(demoCTAs.slice(0, ctaCount));
      setResultType("list");
      toast.success("CTAs generated! (Demo mode)");
    } catch (error: any) {
      toast.info("Demo mode: Showing sample CTAs");
      setResult(["Learn more →", "Get started →", "Join us →"]);
      setResultType("list");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = Array.isArray(result) ? result.join("\n") : result || "";
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const tabs = [
    { id: "generate", label: "Generate", icon: Zap },
    { id: "rewrite", label: "Rewrite", icon: Copy },
    { id: "expand", label: "Expand", icon: Wand2 },
    { id: "summarize", label: "Summarize", icon: MessageSquare },
    { id: "hashtags", label: "Hashtags", icon: Hash },
    { id: "hooks", label: "Hooks", icon: Target },
    { id: "cta", label: "CTA", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Content Studio</h1>
        <p className="text-muted-foreground mt-1">
          Generate, rewrite, and optimize content for your social media
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as Tab);
                    setResult(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content - Generate */}
          {activeTab === "generate" && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Post</CardTitle>
                <CardDescription>Create AI-powered social media posts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic</label>
                  <input
                    type="text"
                    placeholder="What should the post be about?"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform</label>
                    <select
                      value={generatePlatform}
                      onChange={(e) => setGeneratePlatform(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>TWITTER</option>
                      <option>LINKEDIN</option>
                      <option>FACEBOOK</option>
                      <option>INSTAGRAM</option>
                      <option>THREADS</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tone</label>
                    <select
                      value={generateTone}
                      onChange={(e) => setGenerateTone(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="funny">Funny</option>
                      <option value="engaging">Engaging</option>
                      <option value="educational">Educational</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateOptions.includeHashtags}
                        onChange={(e) =>
                          setGenerateOptions((prev) => ({
                            ...prev,
                            includeHashtags: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Include hashtags</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateOptions.includeEmojis}
                        onChange={(e) =>
                          setGenerateOptions((prev) => ({
                            ...prev,
                            includeEmojis: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Include emojis</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateOptions.includeCallToAction}
                        onChange={(e) =>
                          setGenerateOptions((prev) => ({
                            ...prev,
                            includeCallToAction: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Include call-to-action</span>
                    </label>
                  </div>
                </div>

                <Button onClick={handleGeneratePost} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Post
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tab Content - Rewrite */}
          {activeTab === "rewrite" && (
            <Card>
              <CardHeader>
                <CardTitle>Rewrite Content</CardTitle>
                <CardDescription>Rewrite content with different tone or style</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content to Rewrite</label>
                  <textarea
                    placeholder="Paste the content you want to rewrite..."
                    value={rewriteContent}
                    onChange={(e) => setRewriteContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <select
                    value={rewriteTone}
                    onChange={(e) => setRewriteTone(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="funny">Funny</option>
                    <option value="engaging">Engaging</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>

                <Button onClick={handleRewrite} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Rewrite
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tab Content - Hashtags */}
          {activeTab === "hashtags" && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Hashtags</CardTitle>
                <CardDescription>Create relevant hashtags for your content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <textarea
                    placeholder="Paste the content to generate hashtags for..."
                    value={hashtagsContent}
                    onChange={(e) => setHashtagsContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Hashtags: {hashtagsCount}</label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={hashtagsCount}
                    onChange={(e) => setHashtagsCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button onClick={handleGenerateHashtags} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Hash className="mr-2 h-4 w-4" />
                      Generate Hashtags
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tab Content - Hooks */}
          {activeTab === "hooks" && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Hooks</CardTitle>
                <CardDescription>Create attention-grabbing opening lines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <textarea
                    placeholder="Paste the content to generate hooks for..."
                    value={hooksContent}
                    onChange={(e) => setHooksContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Hooks: {hooksCount}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={hooksCount}
                    onChange={(e) => setHooksCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button onClick={handleGenerateHooks} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Generate Hooks
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tab Content - CTA */}
          {activeTab === "cta" && (
            <Card>
              <CardHeader>
                <CardTitle>Generate CTAs</CardTitle>
                <CardDescription>Create compelling call-to-actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Context</label>
                  <textarea
                    placeholder="Describe the context for the CTA..."
                    value={ctaContext}
                    onChange={(e) => setCtaContext(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of CTAs: {ctaCount}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={ctaCount}
                    onChange={(e) => setCtaCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button onClick={handleGenerateCTA} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Generate CTAs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Placeholder for other tabs */}
          {(activeTab === "expand" || activeTab === "summarize") && (
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>This feature will be available soon</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Feature in development</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Result</CardTitle>
              {result && <CardDescription>Ready to use!</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4 min-h-96">
              {!result ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Generate content to see results here</p>
                </div>
              ) : resultType === "text" ? (
                <>
                  <div className="p-4 bg-muted rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{result}</p>
                  </div>
                  <Button onClick={copyToClipboard} className="w-full" variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {Array.isArray(result) &&
                      result.map((item, idx) => (
                        <div key={idx} className="p-2 bg-muted rounded text-sm border">
                          {item}
                        </div>
                      ))}
                  </div>
                  <Button onClick={copyToClipboard} className="w-full" variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
