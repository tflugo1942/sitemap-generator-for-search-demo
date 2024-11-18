"use client";

import { useState } from "react";

export default function Home() {
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [subsetSize, setSubsetSize] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedSitemapUrl, setGeneratedSitemapUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setGeneratedSitemapUrl("");

    try {
      const response = await fetch("/api/generate-subset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sitemapUrl, subsetSize: parseInt(subsetSize) }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate subset");
      }

      const data = await response.json();
      if (data.success && data.sitemapId) {
        setGeneratedSitemapUrl(`/sitemap/${data.sitemapId}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      setError("An error occurred while generating the subset" + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Sitemap Subset Generator</h1>
      <p className="mb-8 text-center text-gray-600">
        Easily generate smaller, manageable sitemaps from large XML files. Input
        your sitemap URL, set a subset size for each content category, and let
        the tool select the required number of URLs for indexing—perfect for
        search sandboxes with URL limits.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label
            htmlFor="sitemapUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Sitemap URL
          </label>
          <input
            type="url"
            id="sitemapUrl"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="https://example.com/sitemap.xml"
          />
        </div>
        <div>
          <label
            htmlFor="subsetSize"
            className="block text-sm font-medium text-gray-700"
          >
            Subset Size
          </label>
          <input
            type="number"
            id="subsetSize"
            value={subsetSize}
            onChange={(e) => setSubsetSize(e.target.value)}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="100"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? "Generating..." : "Generate Subset"}
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {generatedSitemapUrl && (
        <div className="mt-8">
          <p className="text-lg font-semibold">Generated Sitemap:</p>
          <a
            href={generatedSitemapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {`${window.location.origin}${generatedSitemapUrl}`}
          </a>
        </div>
      )}
    </main>
  );
}
