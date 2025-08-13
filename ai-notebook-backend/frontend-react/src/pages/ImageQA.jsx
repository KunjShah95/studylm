import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ImageQA({ base = "" }) {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnswer("");
    setOcrText("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !question.trim()) return;
    setLoading(true);
    setAnswer("");
    setOcrText("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("question", question);
      const res = await fetch(`${base}/ask-image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAnswer(data.answer);
      setOcrText(data.ocr_text);
    } catch (e) {
      setError(e.message || "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Image Q&amp;A (OCR)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          className="input"
        />
        <textarea
          className="input"
          placeholder="Type your question about the image..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!file || !question.trim() || loading}
        >
          {loading ? "Asking…" : "Ask about Image"}
        </button>
      </form>
      {error && <div className="mt-4 text-error-600">{error}</div>}
      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mt-6"
        >
          <h3 className="text-lg font-semibold mb-2">Answer</h3>
          <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 mb-4">{answer}</div>
          {ocrText && (
            <details>
              <summary className="cursor-pointer text-sm text-gray-500">Show OCR Text</summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto max-h-48">{ocrText}</pre>
            </details>
          )}
        </motion.div>
      )}
    </div>
  );
}
