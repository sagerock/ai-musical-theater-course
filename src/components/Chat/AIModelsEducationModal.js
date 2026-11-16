import React, { useState } from 'react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AI_TOOLS } from '../../services/aiApi';
import { MODEL_PRICING, formatCurrency } from '../../utils/costCalculator';

export default function AIModelsEducationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  // Get model pricing helper
  const getModelInfo = (modelName) => {
    const modelId = AI_TOOLS[modelName];
    const pricing = MODEL_PRICING[modelId];
    return { modelId, pricing };
  };

  // Company information
  const companies = {
    'OpenAI': {
      description: 'Founded in 2015, OpenAI is known for ChatGPT and focuses on developing safe AGI (Artificial General Intelligence) that benefits humanity.',
      website: 'openai.com',
      focus: 'General AI, conversational AI, and coding assistance',
      founded: '2015'
    },
    'Anthropic': {
      description: 'Founded in 2021 by former OpenAI researchers, Anthropic focuses on AI safety and creating helpful, harmless, and honest AI systems.',
      website: 'anthropic.com', 
      focus: 'AI safety, research, writing, and reasoning',
      founded: '2021'
    }
  };

  // Model details with educational information
  const modelDetails = {
    'GPT-6 Luna': {
      company: 'OpenAI',
      description: 'A fast, very low-cost OpenAI model built for quick turnaround on everyday tasks.',
      bestFor: ['Quick questions', 'Summaries', 'Everyday help', 'Rapid responses'],
      notBestFor: ['Deep analysis', 'Complex research', 'Long, nuanced writing'],
      whenToUse: 'When you want a fast answer to a simple question or a quick summary and want to keep costs minimal.',
      pricing: getModelInfo('GPT-6 Luna').pricing
    },
    'GPT-6.1 Sol': {
      company: 'OpenAI',
      description: 'OpenAI\'s default model here, balancing quality and cost for a wide range of student work.',
      bestFor: ['Writing help', 'Explanations', 'Analysis', 'General questions'],
      notBestFor: ['The most demanding research projects', 'Simple quick lookups where a cheaper model will do'],
      whenToUse: 'Default choice for most student work. Good all-round for writing help, explaining concepts, and analysis.',
      pricing: getModelInfo('GPT-6.1 Sol').pricing
    },
    'Claude Haiku 5.5': {
      company: 'Anthropic',
      description: 'Anthropic\'s fast, very low-cost model for quick, clear answers.',
      bestFor: ['Quick, clear answers', 'Simple explanations', 'Fast review', 'Low-cost exploration'],
      notBestFor: ['Deep analysis', 'Complex research', 'Extended writing projects'],
      whenToUse: 'When you need a quick, clear answer and want to keep costs low.',
      pricing: getModelInfo('Claude Haiku 5.5').pricing
    },
    'Claude Sonnet 5.5': {
      company: 'Anthropic',
      description: 'Anthropic\'s balanced model, offering strong writing and reasoning at moderate cost.',
      bestFor: ['Writing assistance', 'Analysis', 'Reasoning through problems', 'Thoughtful responses'],
      notBestFor: ['Simple quick questions', 'The most complex research projects'],
      whenToUse: 'Excellent for academic writing, analysis papers, and when you need thoughtful, nuanced responses.',
      pricing: getModelInfo('Claude Sonnet 5.5').pricing
    },
    'Claude Opus 5.5': {
      company: 'Anthropic',
      description: 'The most capable model in the lineup, suited to deep analysis and complex research.',
      bestFor: ['Deep analysis', 'Complex research', 'Demanding writing projects', 'Multi-step reasoning'],
      notBestFor: ['Quick questions', 'Cost-sensitive work', 'Simple tasks'],
      whenToUse: 'Use for major papers, complex research projects, and when you need the strongest analysis available here.',
      pricing: getModelInfo('Claude Opus 5.5').pricing
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📚' },
    { id: 'tokens', name: 'Understanding Tokens', icon: '🔤' },
    { id: 'models', name: 'Model Comparison', icon: '⚖️' },
    { id: 'citations', name: 'Citations & Research', icon: '📖' },
    { id: 'optimization', name: 'AI Optimization', icon: '🔧' },
    { id: 'companies', name: 'AI Companies', icon: '🏢' },
    { id: 'best-practices', name: 'Best Practices', icon: '💡' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Understanding AI Models</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome to AI Model Education</h3>
                  <p className="text-gray-600 mb-4">
                    Understanding different AI models helps you choose the right tool for your academic work. 
                    Each model has unique strengths, costs, and ideal use cases.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">🎯 Why This Matters</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Choose the right tool for your task</li>
                      <li>• Understand cost implications</li>
                      <li>• Develop AI literacy skills</li>
                      <li>• Use resources efficiently</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">📊 Available Models</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• {Object.keys(AI_TOOLS).length} different AI models</li>
                      <li>• 2 leading AI companies (OpenAI and Anthropic)</li>
                      <li>• Various price points</li>
                      <li>• Educational optimizations</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">💡 Quick Start Tips</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• <strong>General use:</strong> Start with GPT-6.1 Sol (the balanced default)</li>
                    <li>• <strong>Quick questions:</strong> GPT-6 Luna or Claude Haiku 5.5 (fast and very low cost)</li>
                    <li>• <strong>Writing and analysis:</strong> Claude Sonnet 5.5 for thoughtful, nuanced work</li>
                    <li>• <strong>Deep analysis and complex research:</strong> Claude Opus 5.5 (most capable in the lineup)</li>
                    <li>• <strong>Sources:</strong> These models don't search the web here, so verify any source they mention</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🎓 Educational Features</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• <strong>Educational Prompting:</strong> Every model gets learning-focused instructions behind the scenes</li>
                    <li>• <strong>Privacy Protection:</strong> Educational data won't train AI models</li>
                    <li>• <strong>Large Context:</strong> All models handle long conversations and documents</li>
                    <li>• <strong>Verify Sources:</strong> Always check any source or fact an AI gives you</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Understanding Tokens</h3>
                  <p className="text-gray-600 mb-4">
                    Tokens are the basic units that AI models use to process text. Think of them as "chunks" of text 
                    that the AI reads and generates.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">🔤 What is a Token?</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• A token is roughly 3-4 characters or about 0.75 words</p>
                    <p>• "Hello world!" = approximately 3 tokens</p>
                    <p>• A typical sentence = 15-20 tokens</p>
                    <p>• A paragraph = 100-200 tokens</p>
                    <p>• A page of text = 750-1000 tokens</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Token Examples:</h4>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Short Question (5 tokens):</p>
                    <p className="text-sm bg-white p-2 rounded border">"What is photosynthesis?"</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Essay Paragraph (~150 tokens):</p>
                    <p className="text-sm bg-white p-2 rounded border">
                      "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. 
                      This fundamental biological process not only sustains plant life but also produces the oxygen that most life forms depend on for survival."
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Research Paper Section (~500 tokens):</p>
                    <p className="text-sm bg-white p-2 rounded border">
                      "A typical multi-paragraph section of a research paper, including introduction, evidence, analysis, and conclusion. 
                      This might include citations, detailed explanations, and complex arguments that require more sophisticated AI processing..."
                    </p>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-3">💰 How Costs Work</h4>
                  <div className="space-y-2 text-sm text-orange-800">
                    <p>• <strong>Input tokens:</strong> What you send to the AI (your question/prompt)</p>
                    <p>• <strong>Output tokens:</strong> What the AI generates for you (the response)</p>
                    <p>• <strong>Different rates:</strong> Output tokens typically cost more than input tokens</p>
                    <p>• <strong>Conversation history:</strong> Previous messages count as input tokens</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Comparison</h3>
                  <p className="text-gray-600 mb-4">
                    Each AI model has different strengths, costs, and ideal use cases. Here's a detailed breakdown:
                  </p>
                </div>

                <div className="space-y-6">
                  {Object.entries(modelDetails).map(([modelName, details]) => (
                    <div key={modelName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{modelName}</h4>
                          <p className="text-sm text-gray-600">by {details.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {details.pricing ? formatCurrency(details.pricing.input) : 'N/A'} / 
                            {details.pricing ? formatCurrency(details.pricing.output) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">per 1M tokens</div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{details.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-800 mb-2">✅ Best for:</h5>
                          <ul className="text-sm text-green-700 space-y-1">
                            {details.bestFor.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-red-800 mb-2">❌ Not ideal for:</h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {details.notBestFor.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 bg-blue-50 p-3 rounded">
                        <h5 className="font-medium text-blue-900 mb-1">💡 When to use:</h5>
                        <p className="text-sm text-blue-800">{details.whenToUse}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'citations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Citations & Academic Research</h3>
                  <p className="text-gray-600 mb-4">
                    Learn how to use AI models effectively for academic research and understand the importance of proper citations in scholarly work.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">🔍 Verify Every Claim and Source</h4>
                  <div className="space-y-2 text-sm text-green-800">
                    <p><strong>None of the models in this app search the web in real time.</strong> Any source an AI names comes from its training, not from a live lookup, so treat it as a lead to check, not as proof.</p>
                    <ul className="ml-4 space-y-1">
                      <li>• <strong>Look it up:</strong> Search your library database or Google Scholar for the exact title and author</li>
                      <li>• <strong>Open the source:</strong> Confirm it exists and actually says what the AI claims</li>
                      <li>• <strong>Check the date:</strong> AI may not know about recent research or events</li>
                      <li>• <strong>Ask for help finding real sources:</strong> Use AI to suggest search terms, then find the sources yourself</li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">📚 What Makes Good Citations</h4>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li>• <strong>Specific Sources:</strong> Author names, not just general topics</li>
                      <li>• <strong>Publication Details:</strong> Journal/book titles, publication dates</li>
                      <li>• <strong>Verifiable Information:</strong> Sources you can actually look up</li>
                      <li>• <strong>Relevant Context:</strong> Sources that directly support claims</li>
                      <li>• <strong>Academic Credibility:</strong> Peer-reviewed and authoritative sources</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-3">⚠️ Citation Red Flags</h4>
                    <ul className="text-sm text-orange-800 space-y-2">
                      <li>• <strong>Generic References:</strong> "Studies show..." without specifics</li>
                      <li>• <strong>Fake Sources:</strong> Made-up author names or publications</li>
                      <li>• <strong>Outdated Information:</strong> Very old sources for current topics</li>
                      <li>• <strong>Circular References:</strong> AI citing other AI-generated content</li>
                      <li>• <strong>Unverifiable Claims:</strong> Sources that don't exist when checked</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-3">🎯 How to Request Better Citations</h4>
                  <div className="space-y-3 text-sm text-purple-800">
                    <div>
                      <strong>Try these prompts for better citations:</strong>
                      <div className="mt-2 bg-white p-3 rounded border text-gray-700 font-mono text-xs">
                        "Please provide specific sources with author names and publication details for your claims about [topic]."
                      </div>
                    </div>
                    <div>
                      <div className="bg-white p-3 rounded border text-gray-700 font-mono text-xs">
                        "Can you include verifiable academic sources to support this analysis?"
                      </div>
                    </div>
                    <div>
                      <div className="bg-white p-3 rounded border text-gray-700 font-mono text-xs">
                        "Please cite specific studies or experts when making factual claims."
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Academic Research Checklist</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <strong>Before Using AI:</strong>
                      <ul className="mt-2 space-y-1 ml-4">
                        <li>☐ Check your institution's AI policy</li>
                        <li>☐ Understand assignment requirements</li>
                        <li>☐ Plan to verify all AI-provided sources</li>
                      </ul>
                    </div>
                    <div>
                      <strong>After AI Response:</strong>
                      <ul className="mt-2 space-y-1 ml-4">
                        <li>☐ Verify all citations independently</li>
                        <li>☐ Cross-check facts with multiple sources</li>
                        <li>☐ Cite AI assistance per your instructor's guidelines</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 mb-3">📝 Academic Writing Workflow with AI</h4>
                  <div className="space-y-3 text-sm text-indigo-800">
                    <div>
                      <strong>Step 1: Research Phase</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• Use <strong>GPT-6.1 Sol</strong> or <strong>Claude Sonnet 5.5</strong> to explore the topic and suggest search terms</li>
                        <li>• Ask: "What are the main ideas and debates on [topic], and what should I search for?"</li>
                        <li>• Find the actual sources yourself through your library databases and Google Scholar</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Step 2: Analysis & Structure</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• Use <strong>Claude Sonnet 5.5</strong> for analytical frameworks</li>
                        <li>• Ask: "Help me analyze these sources and create an argument structure"</li>
                        <li>• Request: "Identify gaps in this research and suggest additional sources"</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Step 3: Writing & Refinement</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• Use <strong>Claude Opus 5.5</strong> for in-depth feedback on complex projects</li>
                        <li>• Request: "Help me improve this paragraph's clarity and academic tone"</li>
                        <li>• Ask: "Review my argument flow and suggest improvements"</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Step 4: Fact-Check & Verify</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• <strong>Always verify all citations independently</strong></li>
                        <li>• Cross-reference claims with multiple sources</li>
                        <li>• Use your library's databases to confirm source accuracy</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">🎯 Effective Prompting for Academic Work</h4>
                  <div className="space-y-3 text-sm text-green-800">
                    <div>
                      <strong>For Research Papers:</strong>
                      <div className="mt-1 bg-white p-2 rounded border text-gray-700 font-mono text-xs">
                        "I'm writing about [topic]. Please provide 3-5 key academic sources with author names, publication years, and main findings. Include both foundational and recent research."
                      </div>
                    </div>
                    <div>
                      <strong>For Literature Reviews:</strong>
                      <div className="mt-1 bg-white p-2 rounded border text-gray-700 font-mono text-xs">
                        "Help me identify the main themes and debates in research about [topic]. Please organize findings by theme and cite specific studies."
                      </div>
                    </div>
                    <div>
                      <strong>For Critical Analysis:</strong>
                      <div className="mt-1 bg-white p-2 rounded border text-gray-700 font-mono text-xs">
                        "Analyze the strengths and limitations of [theory/study]. What are the key criticisms in the literature? Please cite specific sources."
                      </div>
                    </div>
                    <div>
                      <strong>For Methodology Sections:</strong>
                      <div className="mt-1 bg-white p-2 rounded border text-gray-700 font-mono text-xs">
                        "What are the standard methodological approaches for studying [topic]? Please cite examples from recent studies."
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-3">🚨 Important Academic Integrity Note</h4>
                  <p className="text-sm text-red-800">
                    <strong>Always verify AI-provided citations independently.</strong> AI models can provide inaccurate or invented sources, and none of the models here can look sources up on the web. 
                    Your responsibility as a student is to fact-check all sources and ensure they actually support your claims. 
                    When in doubt, consult your librarian or instructor for guidance on proper source verification.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'optimization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How We Optimize AI for Your Learning</h3>
                  <p className="text-gray-600 mb-4">
                    Behind the scenes, our platform uses specialized prompting strategies to enhance each AI model's educational capabilities. 
                    Understanding these optimizations can help you become a better AI user.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">🧠 What is Prompt Engineering?</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Prompt Engineering</strong> is the practice of crafting specific instructions to get better responses from AI models.</p>
                    <p>Think of it like giving detailed, thoughtful instructions to a research assistant - the clearer and more specific your guidance, the better the results.</p>
                    <p><strong>Why it matters:</strong> Different AI models have different strengths, so we tailor the instructions to leverage each model's unique capabilities.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">🔧 Model-Specific Optimizations:</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-center mb-2">
                        <h5 className="font-semibold text-yellow-900">GPT-6 Luna - Efficient Educational Mode</h5>
                      </div>
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>Why this optimization:</strong> Built for speed and low cost, so the instructions favor concise, step-by-step help.
                      </p>
                      <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700 whitespace-pre-line">
                        {`"EFFICIENT EDUCATIONAL MODE: As GPT-6 Luna, provide fast, clear educational support:
• Give concise explanations that build understanding step by step
• Ask a guiding question when the student would learn more by working it out
• Point students toward reliable sources they can verify"`}
                      </div>
                    </div>

                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center mb-2">
                        <h5 className="font-semibold text-blue-900">GPT-6.1 Sol - Balanced Educational Mode</h5>
                      </div>
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Why this optimization:</strong> The default model, tuned for well-reasoned explanations and critical thinking.
                      </p>
                      <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700 whitespace-pre-line">
                        {`"BALANCED EDUCATIONAL MODE: As GPT-6.1 Sol, provide thoughtful, well-reasoned educational support:
• Explain reasoning clearly and show how ideas connect
• Encourage critical thinking with follow-up questions
• Model sound academic writing and evidence-based arguments"`}
                      </div>
                    </div>

                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center mb-2">
                        <h5 className="font-semibold text-green-900">Claude Haiku 5.5 - Efficient Educational Mode</h5>
                      </div>
                      <p className="text-sm text-green-800 mb-2">
                        <strong>Why this optimization:</strong> Fast and low cost, so the instructions favor clear answers and honesty about uncertainty.
                      </p>
                      <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700 whitespace-pre-line">
                        {`"EFFICIENT EDUCATIONAL MODE: As Claude Haiku 5.5, provide fast yet thoughtful educational support:
• Give clear, accurate explanations without padding
• Ask a guiding question when the student would learn more by working it out
• Be honest about uncertainty and suggest how to verify"`}
                      </div>
                    </div>

                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center mb-2">
                        <h5 className="font-semibold text-purple-900">Claude Sonnet 5.5 - Educational Excellence Mode</h5>
                      </div>
                      <p className="text-sm text-purple-800 mb-2">
                        <strong>Why this optimization:</strong> Strong writing and reasoning, so the instructions emphasize helping you build your own arguments.
                      </p>
                      <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700 whitespace-pre-line">
                        {`"EDUCATIONAL EXCELLENCE MODE: As Claude Sonnet 5.5, provide thoughtful educational support:
• Explain complex ideas with clarity and nuance
• Help students develop their own arguments rather than writing for them
• Encourage critical evaluation of sources and evidence"`}
                      </div>
                    </div>

                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-center mb-2">
                        <h5 className="font-semibold text-orange-900">Claude Opus 5.5 - Research Mentor Mode</h5>
                      </div>
                      <p className="text-sm text-orange-800 mb-2">
                        <strong>Why this optimization:</strong> The most capable model in the lineup, so the instructions focus on depth and rigor.
                      </p>
                      <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700 whitespace-pre-line">
                        {`"RESEARCH MENTOR MODE: As Claude Opus 5.5, bring deep analysis to the student's work:
• Engage with complex questions across disciplines in depth
• Help students structure research and test their reasoning
• Model rigorous academic standards and intellectual honesty"`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-3">💡 What This Means for You</h4>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• <strong>Automatic Optimization:</strong> When you select a model, it automatically receives the best prompts for its capabilities</li>
                    <li>• <strong>Enhanced Learning:</strong> Each model is primed to provide educational value tailored to its strengths</li>
                    <li>• <strong>Source Awareness:</strong> All models are prompted to encourage academic rigor and verifying sources</li>
                    <li>• <strong>Transferable Skills:</strong> Understanding these concepts helps you use AI tools more effectively anywhere</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">🎯 Apply This Knowledge</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>When using other AI tools:</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• Be specific about what type of response you want</li>
                      <li>• Mention your context (e.g., "I'm a student working on...")</li>
                      <li>• Ask for sources and citations when you need them</li>
                      <li>• Specify the format you want (academic, analytical, step-by-step, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'companies' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Companies</h3>
                  <p className="text-gray-600 mb-4">
                    Learn about the companies behind the AI models and their different approaches to artificial intelligence.
                  </p>
                </div>

                <div className="space-y-6">
                  {Object.entries(companies).map(([companyName, info]) => (
                    <div key={companyName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{companyName}</h4>
                        <div className="text-right text-sm text-gray-500">
                          <div>Founded: {info.founded}</div>
                          <div>{info.website}</div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{info.description}</p>

                      <div className="bg-gray-50 p-3 rounded">
                        <h5 className="font-medium text-gray-900 mb-1">🎯 Primary Focus:</h5>
                        <p className="text-sm text-gray-700">{info.focus}</p>
                      </div>

                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-2">🔧 Available Models:</h5>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(modelDetails)
                            .filter(([_, details]) => details.company === companyName)
                            .map(([modelName, _]) => (
                              <span key={modelName} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                {modelName}
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'best-practices' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Practices for Model Selection</h3>
                  <p className="text-gray-600 mb-4">
                    Follow these guidelines to choose the right AI model for your academic work and use resources efficiently.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3">🎯 Task-Based Selection</h4>
                    <div className="space-y-3 text-sm text-green-800">
                      <div>
                        <strong>Quick Questions & Summaries:</strong>
                        <p>Use GPT-6 Luna or Claude Haiku 5.5 for fast, very low-cost answers</p>
                      </div>
                      <div>
                        <strong>Homework Help & General Learning:</strong>
                        <p>GPT-6.1 Sol is the balanced default for explanations, writing help, and analysis</p>
                      </div>
                      <div>
                        <strong>Writing & Detailed Analysis:</strong>
                        <p>Claude Sonnet 5.5 offers strong writing and reasoning at moderate cost</p>
                      </div>
                      <div>
                        <strong>Advanced Research Projects:</strong>
                        <p>Claude Opus 5.5 for deep analysis and complex research</p>
                      </div>
                      <div>
                        <strong>Finding Sources:</strong>
                        <p>No model here searches the web, so use your library databases and Google Scholar to find and confirm real sources</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">💰 Cost Management</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• Start with the least expensive models (GPT-6 Luna, Claude Haiku 5.5)</li>
                      <li>• Use the premium model (Claude Opus 5.5) only when needed</li>
                      <li>• Keep conversations focused to reduce token usage</li>
                      <li>• Remember that longer conversations cost more due to history</li>
                      <li>• Check the cost warning indicators before sending messages</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-3">⚠️ Common Mistakes to Avoid</h4>
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li>• Don't use expensive models for simple questions</li>
                      <li>• Don't start long conversations with premium models unless necessary</li>
                      <li>• Don't assume more expensive = always better for your task</li>
                      <li>• Don't forget that AI responses need your critical evaluation</li>
                      <li>• Don't rely on AI for current events; none of these models search the web, so check news and recent sources yourself</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-3">🔄 Workflow Recommendations</h4>
                    <div className="space-y-3 text-sm text-purple-800">
                      <div>
                        <strong>1. Start Small:</strong> Begin with less expensive models to explore your topic
                      </div>
                      <div>
                        <strong>2. Escalate When Needed:</strong> Switch to premium models for final drafts or complex analysis
                      </div>
                      <div>
                        <strong>3. Use Multiple Models:</strong> Different models for different parts of your project
                      </div>
                      <div>
                        <strong>4. Reflect and Learn:</strong> Use the reflection tools to understand how AI helped your learning
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">📚 Academic Integrity</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Always follow your institution's AI policy</li>
                      <li>• Cite AI assistance when required by your instructor</li>
                      <li>• Use AI as a learning tool, not a replacement for your thinking</li>
                      <li>• Verify important facts and claims independently</li>
                      <li>• Reflect on how AI use contributes to your learning goals</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 Tip: You can access this guide anytime by clicking the info icon next to the model selector
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}