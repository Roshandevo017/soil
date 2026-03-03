"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Leaf, Sparkles } from "lucide-react"
import { soilDataStore } from "@/lib/soil-data-store"
import type { DatasetStats, PredictionResult, ClusterResult } from "@/lib/types"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  "What is the overall health of my soil samples?",
  "Which nutrients are deficient in my soil?",
  "How can I improve soil productivity?",
  "What fertilizers should I use?",
  "Explain the clustering results",
  "What is the ideal pH for crops?",
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI soil health assistant. I can help you understand your soil analysis results, provide recommendations for improving soil productivity, and answer questions about soil management. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState<DatasetStats | null>(null)
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [clusters, setClusters] = useState<ClusterResult[]>([])

  useEffect(() => {
    setStats(soilDataStore.getStats())
    setPredictions(soilDataStore.getPredictions())
    setClusters(soilDataStore.getClusters())
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const generateResponse = (question: string): string => {
    const lowerQ = question.toLowerCase()

    // Overall health assessment
    if (lowerQ.includes("overall") || lowerQ.includes("health") || lowerQ.includes("summary")) {
      if (predictions.length === 0) {
        return "I don't have any prediction data yet. Please run the productivity prediction on your uploaded dataset first, then I can provide insights about your soil health."
      }
      const high = predictions.filter((p) => p.productivityClass === "High").length
      const medium = predictions.filter((p) => p.productivityClass === "Medium").length
      const low = predictions.filter((p) => p.productivityClass === "Low").length
      const avgScore = predictions.reduce((sum, p) => sum + p.productivityScore, 0) / predictions.length

      return `Based on my analysis of ${predictions.length} soil samples:\n\n• **High Productivity**: ${high} samples (${((high / predictions.length) * 100).toFixed(1)}%)\n• **Medium Productivity**: ${medium} samples (${((medium / predictions.length) * 100).toFixed(1)}%)\n• **Low Productivity**: ${low} samples (${((low / predictions.length) * 100).toFixed(1)}%)\n\nThe average productivity score is **${avgScore.toFixed(1)}/100**. ${avgScore >= 70 ? "Your soil is generally in good condition!" : avgScore >= 40 ? "There's room for improvement in soil health." : "Several samples need attention to improve productivity."}`
    }

    // Nutrient deficiency
    if (lowerQ.includes("nutrient") || lowerQ.includes("deficien") || lowerQ.includes("lacking")) {
      if (!stats) {
        return "I need your soil data to analyze nutrient levels. Please upload a dataset first."
      }
      const issues: string[] = []
      if (stats.summary.nitrogen && stats.summary.nitrogen.mean < 200)
        issues.push("Nitrogen (N) is below optimal levels")
      if (stats.summary.phosphorus && stats.summary.phosphorus.mean < 20) issues.push("Phosphorus (P) is deficient")
      if (stats.summary.potassium && stats.summary.potassium.mean < 150) issues.push("Potassium (K) needs improvement")
      if (stats.summary.organicCarbon && stats.summary.organicCarbon.mean < 0.5) issues.push("Organic carbon is low")

      if (issues.length === 0) {
        return "Based on the average values, your soil appears to have adequate macro-nutrient levels. However, I recommend checking individual sample results for localized deficiencies."
      }
      return `Based on your data, I've identified these potential deficiencies:\n\n${issues.map((i) => `• ${i}`).join("\n")}\n\nWould you like specific recommendations for addressing these issues?`
    }

    // Improve productivity
    if (lowerQ.includes("improve") || lowerQ.includes("increase") || lowerQ.includes("better")) {
      return `Here are key strategies to improve soil productivity:\n\n**1. Nutrient Management**\n• Test soil regularly and apply fertilizers based on results\n• Use balanced NPK fertilizers appropriate for your crops\n• Consider slow-release fertilizers for sustained nutrition\n\n**2. Organic Matter**\n• Add compost or farmyard manure (10-15 tonnes/ha)\n• Practice crop residue incorporation\n• Use green manuring with legumes\n\n**3. pH Correction**\n• Apply lime for acidic soils (pH < 6.0)\n• Use sulfur or gypsum for alkaline soils (pH > 7.5)\n\n**4. Water Management**\n• Maintain optimal soil moisture (40-60%)\n• Implement proper drainage for waterlogged areas\n\n**5. Soil Structure**\n• Reduce tillage to prevent compaction\n• Add organic matter to improve structure`
    }

    // Fertilizer recommendations
    if (lowerQ.includes("fertiliz") || lowerQ.includes("fertilis")) {
      return `**Fertilizer Recommendations Based on Soil Analysis:**\n\n**For Nitrogen Deficiency:**\n• Urea (46% N): 100-150 kg/ha\n• Ammonium Sulfate (21% N): 200-300 kg/ha\n• Split applications recommended\n\n**For Phosphorus Deficiency:**\n• Single Super Phosphate (16% P₂O₅): 150-200 kg/ha\n• DAP (46% P₂O₅): 50-75 kg/ha\n• Apply at planting time\n\n**For Potassium Deficiency:**\n• Muriate of Potash (60% K₂O): 75-100 kg/ha\n• Sulfate of Potash for sensitive crops\n\n**Micronutrients:**\n• Zinc Sulfate: 25 kg/ha\n• Ferrous Sulfate: 20-25 kg/ha\n• Borax: 10-15 kg/ha\n\n*Always adjust rates based on soil test results and crop requirements.*`
    }

    // Clustering explanation
    if (lowerQ.includes("cluster") || lowerQ.includes("group")) {
      if (clusters.length === 0) {
        return "No clustering analysis has been performed yet. Please go to the Clustering page and run K-Means clustering on your data."
      }
      return `**Cluster Analysis Results:**\n\nI've identified ${clusters.length} distinct soil groups in your data:\n\n${clusters.map((c) => `**Cluster ${c.cluster + 1}** (${c.samples.length} samples)\n${c.characteristics}`).join("\n\n")}\n\nClustering helps identify soil zones with similar characteristics, allowing for targeted management strategies. Samples within the same cluster should respond similarly to treatments.`
    }

    // pH information
    if (lowerQ.includes("ph") || lowerQ.includes("acidic") || lowerQ.includes("alkaline")) {
      return `**Soil pH Guide:**\n\n**Optimal Range:** 6.0 - 7.5 for most crops\n\n**pH Categories:**\n• < 5.5: Strongly acidic - Apply lime\n• 5.5-6.0: Moderately acidic - Light liming may help\n• 6.0-7.0: Slightly acidic to neutral - Ideal range\n• 7.0-7.5: Neutral to slightly alkaline - Good for most crops\n• 7.5-8.5: Moderately alkaline - Apply sulfur/gypsum\n• > 8.5: Strongly alkaline - Needs treatment\n\n**Effects of Improper pH:**\n• Nutrient lockout (especially P, Fe, Mn, Zn)\n• Reduced microbial activity\n• Aluminum/manganese toxicity in acidic soils\n\n${stats?.summary.ph ? `Your average pH is **${stats.summary.ph.mean.toFixed(2)}**` : "Upload data to see your pH levels."}`
    }

    // Default response
    return `That's a great question about soil management! While I can provide general guidance, here are some key points:\n\n• Regular soil testing is essential for informed decisions\n• Balanced nutrition supports healthy crop growth\n• Organic matter is crucial for soil health\n• Proper pH management ensures nutrient availability\n\nWould you like me to explain any specific aspect of soil productivity? You can ask about nutrients, fertilizers, pH management, or view your analysis results.`
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI thinking
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    const response = generateResponse(input)
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response,
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages((prev) => [...prev, assistantMessage])
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="flex h-screen">
      <SidebarNav />
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">AI Soil Assistant</h1>
            <p className="text-muted-foreground">Get insights and recommendations about your soil health</p>
          </div>

          <Card className="flex-1 flex flex-col bg-card border-border overflow-hidden">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">SoilPredict AI</CardTitle>
                  <CardDescription>Powered by agricultural knowledge base</CardDescription>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </CardHeader>

            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback
                        className={message.role === "assistant" ? "bg-primary/20 text-primary" : "bg-muted"}
                      >
                        {message.role === "assistant" ? <Leaf className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Leaf className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border space-y-3">
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.slice(0, 3).map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 bg-transparent"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {question}
                  </Button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about soil health, nutrients, recommendations..."
                  className="flex-1 bg-input border-border"
                  disabled={isTyping}
                />
                <Button type="submit" disabled={!input.trim() || isTyping}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
