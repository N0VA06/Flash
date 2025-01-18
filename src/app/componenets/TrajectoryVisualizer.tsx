// 
"use client"
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Upload, Link, X, Moon, Sun, Download, Trash2, Eye, EyeOff, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import axios from "axios"
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

export default function TrajectoryVisualizer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [timestamps, setTimestamps] = useState('')
  const [prompt, setPrompt] = useState('')
  const [plotData, setPlotData] = useState<any>(null)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [loading, setLoading] = useState({ file: false, url: false })
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [plotTheme, setPlotTheme] = useState('default')

  useEffect(() => {
    // Check system color scheme
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
    
    // Listen for system color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setError(null)
      // Create video preview URL
      const previewUrl = URL.createObjectURL(file)
      setVideoPreview(previewUrl)
    } else {
      setError('Please select a valid video file')
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file first')
      return
    }

    setLoading(prev => ({ ...prev, file: true }))
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)

      const response = await fetch('http://localhost:8000/trajectory-3d', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process video')
      }

      const data = await response.json()
      setPlotData(data.plot_3d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(prev => ({ ...prev, file: false }))
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPlotData(null)
    setError(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
    }
  }

  const clearUrl = () => {
    setVideoUrl('')
    setTimestamps('')
    setPrompt('')
    setAnalysisResult(null)
    setError(null)
  }

  const handleUrlAnalysis = async () => {
    if (!videoUrl || !prompt) {
      setError('Please enter both the video URL and a prompt.')
      return
    }

    setLoading(prev => ({ ...prev, url: true }))
    setError(null)

    const timestampArray = [4, 5, 6, 8, 13, 17, 25]

    try {
      const result = await axios.post('http://localhost:8080/analyze-video', {
        videoUrl,
        timestamps: timestampArray,
        prompt: `${prompt} use input`,
      })

      if (result.data) {
        setAnalysisResult(result.data.text || 'Analysis completed but no result returned.')
      } else {
        throw new Error('Unexpected response format.')
      }
    } catch (error) {
      console.error('Error analyzing video:', error)
      setError('Failed to analyze video. Please try again later.')
    } finally {
      setLoading(prev => ({ ...prev, url: false }))
    }
  }

  const exportResults = () => {
    const results = {
      analysis: analysisResult,
      plot: plotData,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `video-analysis-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getPlotColors = () => {
    const themes = {
      default: {
        bg: darkMode ? 'rgba(31, 41, 55, 0)' : 'rgba(255,255,255,0)',
        text: darkMode ? '#e5e7eb' : '#5f6368',
        grid: darkMode ? '#374151' : '#e5e7eb'
      },
      vibrant: {
        bg: darkMode ? 'rgba(31, 41, 55, 0)' : 'rgba(255,255,255,0)',
        text: darkMode ? '#60a5fa' : '#2563eb',
        grid: darkMode ? '#4b5563' : '#93c5fd'
      },
      minimal: {
        bg: darkMode ? 'rgba(31, 41, 55, 0)' : 'rgba(255,255,255,0)',
        text: darkMode ? '#9ca3af' : '#6b7280',
        grid: darkMode ? '#1f2937' : '#f3f4f6'
      }
    }
    return themes[plotTheme as keyof typeof themes]
  }

  return (
    <div className={`min-h-screen w-full p-4 transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className={`text-3xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Google Cloud x MLB Hackathon
          </h1>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className={`rounded-full ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200'}`}>
                  <Palette className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setPlotTheme('default')}>Default Theme</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPlotTheme('vibrant')}>Vibrant Theme</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPlotTheme('minimal')}>Minimal Theme</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className={`rounded-full ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200'}`}
            >
              {darkMode ? 
                <Sun className="h-5 w-5 text-gray-300" /> : 
                <Moon className="h-5 w-5 text-gray-600" />
              }
            </Button>
          </div>
        </div>

        <Card className={`border shadow-xl rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader className={`px-8 py-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <CardTitle className={`text-2xl font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Flash - Baseball Statcast Extractor
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-8">
              {/* File Upload Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className={`text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    3D Trajectory Visualization
                  </h3>
                  {videoPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className={`rounded-full ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {showPreview ? (
                        <EyeOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  )}
                </div>

                {videoPreview && showPreview && (
                  <div className={`rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-96 object-contain bg-black"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    className={`relative px-6 h-12 font-medium transition-colors rounded-full
                      ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-0'}`}
                    disabled={loading.file}
                  >
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 mr-2" />
                    Select Video
                  </Button>

                  {selectedFile && (
                    <>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedFile.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFile}
                        disabled={loading.file}
                        className={`rounded-full ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || loading.file}
                  className={`w-full h-12 font-medium transition-colors rounded-full
                    ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  {loading.file ? 'Processing...' : 'Generate 3D Visualization'}
                </Button>
              </div>

              <Separator className={darkMode ? 'bg-gray-700' : 'bg-gray-200'} />

              {/* Video URL Analysis Section */}
              <div className="space-y-6">
                <h3 className={`text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Video Analysis
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="video-url" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Video URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="video-url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Enter video URL"
                      className={`flex-1 h-12 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-white border-gray-200'}`}
                    />
                    {videoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearUrl}
                        disabled={loading.url}
                        className={`rounded-full ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2"></div>
                <Label htmlFor="prompt" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Analysis Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the analysis you want for the video"
                    className={`min-h-32 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-white border-gray-200'}`}
                  />
                </div>

                <Button
                  onClick={handleUrlAnalysis}
                  disabled={!videoUrl || loading.url}
                  className={`w-full h-12 font-medium transition-colors rounded-full
                    ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  {loading.url ? 'Analyzing...' : 'Analyze Video'}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className={`border-0 rounded-lg ${darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-600'}`}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Results Section */}
              {(plotData || analysisResult) && (
                <div className="space-y-8">
                  <Separator className={darkMode ? 'bg-gray-700' : 'bg-gray-200'} />
                  <div className="flex justify-between items-center">
                    <h3 className={`text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Results</h3>
                    <Button
                      onClick={exportResults}
                      variant="outline"
                      className={`rounded-full ${darkMode ? 'border-gray-700 hover:border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Results
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {/* 3D Visualization */}
                    {plotData && (
                      <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <h4 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>3D Trajectory</h4>
                        <div className="h-[600px]">
                          <Plot
                            data={plotData.data.map((trace: any) => ({
                              ...trace,
                              line: {
                                ...trace.line,
                                color: plotTheme === 'vibrant' ? '#60a5fa' : undefined
                              }
                            }))}
                            layout={{
                              ...plotData.layout,
                              width: undefined,
                              height: undefined,
                              autosize: true,
                              margin: { t: 20, r: 20, l: 20, b: 20 },
                              paper_bgcolor: getPlotColors().bg,
                              plot_bgcolor: getPlotColors().bg,
                              font: {
                                family: 'Google Sans, arial, sans-serif',
                                color: getPlotColors().text
                              },
                              scene: {
                                ...plotData.layout.scene,
                                xaxis: {
                                  ...plotData.layout.scene?.xaxis,
                                  gridcolor: getPlotColors().grid,
                                  zerolinecolor: getPlotColors().grid
                                },
                                yaxis: {
                                  ...plotData.layout.scene?.yaxis,
                                  gridcolor: getPlotColors().grid,
                                  zerolinecolor: getPlotColors().grid
                                },
                                zaxis: {
                                  ...plotData.layout.scene?.zaxis,
                                  gridcolor: getPlotColors().grid,
                                  zerolinecolor: getPlotColors().grid
                                }
                              }
                            }}
                            config={{ 
                              responsive: true,
                              displayModeBar: true,
                              displaylogo: false,
                              toImageButtonOptions: {
                                format: 'png',
                                filename: 'trajectory-3d',
                                height: 1200,
                                width: 1600,
                                scale: 2
                              }
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Analysis Results */}
                    {analysisResult && (
                      <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <h4 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Video Analysis</h4>
                        <p className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{analysisResult}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};