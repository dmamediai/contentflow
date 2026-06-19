"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";

export function useAI() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePost = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/generate-post", input);
      return response.data.data.content;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to generate post";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const rewriteContent = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/rewrite", input);
      return response.data.data.rewrittenContent;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to rewrite content";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const expandContent = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/expand", input);
      return response.data.data.expandedContent;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to expand content";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const summarizeContent = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/summarize", input);
      return response.data.data.summary;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to summarize content";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const translateContent = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/translate", input);
      return response.data.data.translatedContent;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to translate content";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const generateHashtags = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/hashtags", input);
      return response.data.data.hashtags;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to generate hashtags";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const generateHooks = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/hooks", input);
      return response.data.data.hooks;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to generate hooks";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const generateCallToActions = async (input: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/ai/cta", input);
      return response.data.data.ctas;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to generate CTAs";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generatePost,
    rewriteContent,
    expandContent,
    summarizeContent,
    translateContent,
    generateHashtags,
    generateHooks,
    generateCallToActions,
  };
}
