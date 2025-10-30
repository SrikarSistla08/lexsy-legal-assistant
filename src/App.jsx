import React, { useState } from "react";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

function App() {
  const [docText, setDocText] = useState("");
  const [error, setError] = useState("");
  const [placeholders, setPlaceholders] = useState([]); // Array of {key, original}
  const [responses, setResponses] = useState({});
  const [currentPHIndex, setCurrentPHIndex] = useState(0);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [manualPlaceholder, setManualPlaceholder] = useState("");

  function findPlaceholders(text) {
    const found = [];
    const seen = new Set();
    
    // Match [anything inside brackets] - most common in legal docs
    const square = /\[([^\[\]\n]+?)\]/g;
    let m;
    
    while ((m = square.exec(text))) {
      const original = m[1].trim();
      if (!original) continue;
      
      // Create unique key but keep original
      const key = original
        .replace(/\s+/g, "_")
        .replace(/[^A-Za-z0-9_$]/g, "")
        .toUpperCase();
      
      // Use combination of key + original to allow duplicates with different contexts
      const uniqueId = `${key}_${m.index}`;
      
      if (!seen.has(original)) {
        seen.add(original);
        found.push({ key, original, pattern: `[${original}]` });
      }
    }
    
    // Also check for {VAR}, {{VAR}}, <<VAR>>, underscores
    const brace = /{{\s*([^{}]{1,80}?)\s*}}|{\s*([^{}]{1,80}?)\s*}/g;
    while ((m = brace.exec(text))) {
      const original = (m[1] || m[2]).trim();
      if (!original || seen.has(original)) continue;
      seen.add(original);
      const key = original.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
      found.push({ key, original, pattern: m[0] });
    }
    
    const angle = /<<\s*([^<>]{1,80}?)\s*>>|<\s*([^<>]{1,80}?)\s*>/g;
    while ((m = angle.exec(text))) {
      const original = (m[1] || m[2]).trim();
      if (!original || seen.has(original)) continue;
      seen.add(original);
      const key = original.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
      found.push({ key, original, pattern: m[0] });
    }
    
    if (/_{5,}/.test(text) && !seen.has("BLANK")) {
      found.push({ key: "BLANK", original: "_____", pattern: "______" });
    }
    
    return found;
  }

  function fillPlaceholders(text, mapping) {
    let result = text;
    placeholders.forEach(ph => {
      if (mapping[ph.key]) {
        // Escape special regex characters in the original pattern
        const escaped = ph.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replaceAll(new RegExp(escaped, 'g'), mapping[ph.key]);
      }
    });
    return result;
  }

  async function handleDownload() {
    const filled = fillPlaceholders(docText, responses);
    const lines = filled.split("\n");
    const doc = new Document({
      sections: [{
        properties: {},
        children: lines.map(line => new Paragraph({ children: [new TextRun(line)] }))
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "completed_document.docx");
  }

  const handleFileChange = async (e) => {
    setError("");
    setPlaceholders([]);
    setResponses({});
    setCurrentPHIndex(0);
    setInput("");
    setShowResult(false);
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".docx")) {
      setError("Please upload a .docx file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setDocText(value);
        const found = findPlaceholders(value);
        setPlaceholders(found);
      } catch {
        setError("Failed to parse .docx file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleResponse = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const ph = placeholders[currentPHIndex];
    setResponses((r) => ({ ...r, [ph.key]: input }));
    setInput("");
    if (currentPHIndex + 1 < placeholders.length) {
      setCurrentPHIndex(currentPHIndex + 1);
    } else {
      setShowResult(true);
    }
  };

  const addManualPlaceholder = () => {
    const raw = manualPlaceholder.trim();
    if (!raw) return;
    const key = raw.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
    if (key && !placeholders.find(p => p.key === key)) {
      setPlaceholders((p) => [...p, { key, original: raw, pattern: `[${raw}]` }]);
    }
    setManualPlaceholder("");
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      width: "100vw",
      background: "linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)",
      padding: 0,
      margin: 0,
      boxSizing: "border-box"
    }}>
      <div style={{ 
        width: "100%",
        padding: "40px 80px",
        boxSizing: "border-box"
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: 40,
          color: "#fff"
        }}>
          <h1 style={{ 
            fontSize: 42, 
            fontWeight: 700, 
            marginBottom: 8,
            letterSpacing: "-0.5px"
          }}>
            Lexsy Legal Assistant
          </h1>
          <p style={{ 
            fontSize: 18, 
            opacity: 0.9,
            fontWeight: 300
          }}>
            Transform your legal documents with AI-powered automation
          </p>
        </div>

        {/* Upload Card */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          marginBottom: 24,
          boxSizing: "border-box"
        }}>
          <label style={{
            display: "block",
            marginBottom: 16,
            fontSize: 16,
            fontWeight: 600,
            color: "#1f2937"
          }}>
            Upload Legal Document
          </label>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <input 
              type="file" 
              accept=".docx" 
              onChange={handleFileChange}
              style={{
                display: "block",
                width: "100%",
                padding: "16px",
                border: "2px dashed #cbd5e1",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                color: "#64748b",
                background: "#f8fafc",
                transition: "all 0.2s",
                boxSizing: "border-box",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden"
              }}
            />
          </div>
          {error && (
            <div style={{ 
              marginTop: 12,
              padding: "12px 16px",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500
            }}>
              {error}
            </div>
          )}
        </div>

      {docText && (
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          marginBottom: 24,
          boxSizing: "border-box"
        }}>
          <h2 style={{ 
            marginBottom: 16, 
            fontSize: 20, 
            fontWeight: 600,
            color: "#1f2937"
          }}>
            📄 Document Preview
          </h2>
          <textarea
            rows="6"
            value={docText}
            readOnly
            style={{
              width: "100%",
              padding: 16,
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />
          
          <h3 style={{ 
            marginTop: 24, 
            marginBottom: 12,
            fontSize: 18, 
            fontWeight: 600,
            color: "#1f2937"
          }}>
            🔖 Detected Placeholders
          </h3>
          {placeholders.length === 0 ? (
            <p style={{ 
              color: "#64748b",
              fontSize: 14,
              padding: "12px 16px",
              background: "#f1f5f9",
              borderRadius: 8
            }}>
              No placeholders found. Upload a document with [placeholders] to get started.
            </p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 16
            }}>
              {placeholders.map((ph, idx) => (
                <div key={idx} style={{
                  padding: "10px 14px",
                  background: "#e0f2fe",
                  border: "1px solid #1e3a8a",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1e3a8a",
                  fontFamily: "monospace",
                  wordBreak: "break-word",
                  textAlign: "center",
                  whiteSpace: "normal",
                  overflow: "hidden"
                }}>
                  {ph.pattern}
                </div>
              ))}
            </div>
          )}

          <div style={{ 
            marginTop: 16,
            padding: 16,
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0"
          }}>
            <label style={{
              display: "block",
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "#475569"
            }}>
              Add placeholder manually (optional)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "#fff",
                  color: "#1f2937",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 14
                }}
                type="text"
                value={manualPlaceholder}
                placeholder="e.g., Company Name"
                onChange={(e) => setManualPlaceholder(e.target.value)}
              />
              <button
                type="button"
                onClick={addManualPlaceholder}
                style={{
                  padding: "10px 20px",
                  background: "#1e3a8a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s"
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {docText && placeholders.length > 0 && !showResult && (
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          marginBottom: 24,
          boxSizing: "border-box"
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16
            }}>
              <h2 style={{ 
                fontSize: 20, 
                fontWeight: 600,
                color: "#1f2937",
                margin: 0
              }}>
                💬 Fill Placeholder Values
              </h2>
              <span style={{
                padding: "4px 12px",
                background: "#e0f2fe",
                color: "#1e3a8a",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600
              }}>
                {currentPHIndex + 1} of {placeholders.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              height: 6,
              background: "#e2e8f0",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 24
            }}>
              <div style={{
                height: "100%",
                width: `${((currentPHIndex + 1) / placeholders.length) * 100}%`,
                background: "linear-gradient(90deg, #1e3a8a 0%, #0f766e 100%)",
                transition: "width 0.3s ease"
              }}/>
            </div>
          </div>

          <form onSubmit={handleResponse}>
            <div style={{
              padding: 20,
              background: "#f8fafc",
              borderRadius: 12,
              marginBottom: 20,
              border: "1px solid #e2e8f0"
            }}>
              <label style={{
                display: "block",
                fontSize: 15,
                fontWeight: 500,
                color: "#475569",
                marginBottom: 12
              }}>
                What value would you like for{" "}
                <span style={{
                  padding: "2px 8px",
                  background: "#fff",
                  color: "#1e3a8a",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: 14
                }}>
                  {placeholders[currentPHIndex].pattern}
                </span>
                ?
              </label>
              <input
                autoFocus
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  background: "#fff",
                  color: "#1f2937",
                  border: "2px solid #cbd5e1",
                  borderRadius: 8,
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                placeholder={`Enter value for ${placeholders[currentPHIndex].original}`}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: 16,
                fontWeight: 600,
                background: "linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 14px rgba(30, 58, 138, 0.4)"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(30, 58, 138, 0.5)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 14px rgba(30, 58, 138, 0.4)";
              }}
            >
              {currentPHIndex + 1 === placeholders.length ? "Complete →" : "Next →"}
            </button>
          </form>
        </div>
      )}

      {showResult && (
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          marginBottom: 24,
          boxSizing: "border-box"
        }}>
          {/* Success Banner */}
          <div style={{
            padding: 20,
            background: "linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)",
            borderRadius: 12,
            marginBottom: 32,
            textAlign: "center",
            color: "#fff"
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
              Document Completed!
            </h2>
            <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: 15 }}>
              All placeholders have been filled successfully
            </p>
          </div>

          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: 16
          }}>
            📋 Placeholder Values
          </h3>
          <div style={{
            display: "grid",
            gap: 12,
            marginBottom: 32
          }}>
            {placeholders.map((ph, idx) => (
              <div key={idx} style={{
                padding: 16,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1e3a8a"
                }}>
                  {ph.pattern}
                </span>
                <span style={{
                  fontSize: 14,
                  color: "#1f2937",
                  fontWeight: 500
                }}>
                  {responses[ph.key] || "(not filled)"}
                </span>
              </div>
            ))}
          </div>

          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: 16
          }}>
            📝 Completed Document
          </h3>
          <textarea
            rows="12"
            value={fillPlaceholders(docText, responses)}
            readOnly
            style={{
              width: "100%",
              padding: 16,
              marginBottom: 20,
              background: "#f8fafc",
              color: "#1f2937",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace",
              resize: "vertical",
              boxSizing: "border-box",
              overflow: "auto"
            }}
          />

          <button
            onClick={handleDownload}
            style={{
              width: "100%",
              padding: "16px 24px",
              fontSize: 16,
              fontWeight: 600,
              background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(15, 118, 110, 0.5)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 14px rgba(15, 118, 110, 0.4)";
            }}
          >
            <span style={{ fontSize: 20 }}>⬇</span>
            Download Completed Document (.docx)
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;