// "use client"
// import { useState } from 'react'
// import dynamic from 'next/dynamic'
// import { Upload, X } from 'lucide-react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Alert, AlertDescription } from '@/components/ui/alert'

// const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

// export default function TrajectoryVisualizer() {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)
//   const [plotData, setPlotData] = useState<any>(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (file && file.type.startsWith('video/')) {
//       setSelectedFile(file)
//       setError(null)
//     } else {
//       setError('Please select a valid video file')
//     }
//   }

//   const handleUpload = async () => {
//     if (!selectedFile) {
//       setError('Please select a video file first')
//       return
//     }

//     setLoading(true)
//     setError(null)

//     try {
//       const formData = new FormData()
//       formData.append('video', selectedFile)

//       const response = await fetch('http://localhost:8000/trajectory-3d', {
//         method: 'POST',
//         body: formData,
//       })

//       if (!response.ok) {
//         throw new Error('Failed to process video')
//       }

//       const data = await response.json()
//       setPlotData(data.plot_3d)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'An error occurred')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const clearFile = () => {
//     setSelectedFile(null)
//     setPlotData(null)
//     setError(null)
//   }

//   return (
//     <div className="w-full max-w-4xl mx-auto space-y-4 bg-white">
//       <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
//         <CardHeader className="bg-white border-b border-gray-100 px-6 py-4">
//           <CardTitle className="text-xl text-gray-600 font-normal">
//             3D Trajectory Visualization
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-6">
//           <div className="space-y-4">
//             <div className="flex items-center gap-4">
//               <Button
//                 variant="outline"
//                 className="relative bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-full px-6 h-10 font-medium transition-colors"
//                 disabled={loading}
//               >
//                 <input
//                   type="file"
//                   accept="video/*"
//                   onChange={handleFileSelect}
//                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                 />
//                 <Upload className="w-4 h-4 mr-2" />
//                 Select Video
//               </Button>
              
//               {selectedFile && (
//                 <>
//                   <span className="text-sm text-gray-600">
//                     {selectedFile.name}
//                   </span>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearFile}
//                     disabled={loading}
//                     className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
//                   >
//                     <X className="w-4 h-4" />
//                   </Button>
//                 </>
//               )}
//             </div>

//             <Button 
//               onClick={handleUpload}
//               disabled={!selectedFile || loading}
//               className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 font-medium transition-colors"
//             >
//               {loading ? 'Processing...' : 'Generate Visualization'}
//             </Button>

//             {error && (
//               <Alert variant="destructive" className="bg-red-50 border-0 rounded-lg text-red-600">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}

//             {plotData && (
//               <div className="mt-4 rounded-lg p-4 bg-white border border-gray-100">
//                 <Plot
//                   data={plotData.data}
//                   layout={{
//                     ...plotData.layout,
//                     width: undefined,
//                     height: 500,
//                     margin: { t: 0, r: 0, l: 0, b: 0 },
//                     paper_bgcolor: 'rgba(0,0,0,0)',
//                     plot_bgcolor: 'rgba(0,0,0,0)',
//                     font: {
//                       family: 'Google Sans, arial, sans-serif',
//                       color: '#5f6368'
//                     }
//                   }}
//                   config={{ responsive: true }}
//                   className="w-full"
//                 />
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
  // const handleUrlAnalysis = async () => {
  //   if (!videoUrl) {
  //     setError('Please enter a video URL')
  //     return
  //   }

  //   setLoading(prev => ({ ...prev, url: true }))
  //   setError(null)

  //   try {
  //     const timestampArray = timestamps
  //       .split(',')
  //       .map(t => parseInt(t.trim()))
  //       .filter(t => !isNaN(t))

  //     const response = await fetch('http://localhost:8080/analyze-video', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         videoUrl,
  //         timestamps: timestampArray,
  //         prompt: prompt || 'Analyze these frames and describe what is happening in the video',
  //       }),
  //     })

  //     if (!response.ok) {
  //       throw new Error('Failed to analyze video')
  //     }

  //     const data = await response.json()
  //     setAnalysisResult(data.analysis)
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'An error occurred')
  //   } finally {
  //     setLoading(prev => ({ ...prev, url: false }))
  //   }
  // }


"use client"
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Upload, Link, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setError(null)
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
      setError('Please enter both the video URL and a prompt.');
      return;
    }
  
    setLoading((prev) => ({ ...prev, url: true }));
    setError(null);
  
    const timestampArray = [4, 5, 6, 8, 13, 17, 25]; // Static timestamps as per your example
  
    try {
      const result = await axios.post('http://localhost:8080/analyze-video', {
        videoUrl,
        timestamps: timestampArray,
        prompt: `${prompt} use input`,
      });
  
      if (result.data) {
        setAnalysisResult(result.data.text || 'Analysis completed but no result returned.');
      } else {
        throw new Error('Unexpected response format.');
      }
    } catch (error) {
      console.error('Error analyzing video:', error);
      setError('Failed to analyze video. Please try again later.');
    } finally {
      setLoading((prev) => ({ ...prev, url: false }));
    }
  };
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 bg-white">
      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-100 px-6 py-4">
          <CardTitle className="text-xl text-gray-600 font-normal">
            Video Analysis & Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">3D Trajectory Visualization</h3>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="relative bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-full px-6 h-10 font-medium transition-colors"
                  disabled={loading.file}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 mr-2" />
                  Select Video
                </Button>
                
                {selectedFile && (
                  <>
                    <span className="text-sm text-gray-600">
                      {selectedFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                      disabled={loading.file}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              <Button 
                onClick={handleFileUpload}
                disabled={!selectedFile || loading.file}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 font-medium transition-colors"
              >
                {loading.file ? 'Processing...' : 'Generate 3D Visualization'}
              </Button>
            </div>

            <Separator className="my-6" />

{/* Video URL Analysis Section */}
<div className="space-y-4">
  <h3 className="text-lg font-medium text-gray-900">Video Analysis</h3>
  <div>
    <Label htmlFor="video-url">Video URL</Label>
    <div className="flex gap-2">
      <Input
        id="video-url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Enter video URL"
        className="flex-1"
      />
      {videoUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearUrl}
          disabled={loading.url}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  </div>

  <div>
    <Label htmlFor="prompt">Analysis Prompt</Label>
    <Textarea
      id="prompt"
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="Describe the analysis you want for the video"
    />
  </div>

  <Button
    onClick={handleUrlAnalysis}
    disabled={!videoUrl || loading.url}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 font-medium transition-colors"
  >
    {loading.url ? 'Analyzing...' : 'Analyze Video'}
  </Button>
</div>

            {error && (
              <Alert variant="destructive" className="bg-red-50 border-0 rounded-lg text-red-600">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results Section */}
            {(plotData || analysisResult) && (
              <div className="space-y-6 mt-6">
                <Separator />
                <h3 className="text-lg font-medium text-gray-900">Results</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 3D Visualization */}
                  {plotData && (
                    <div className="rounded-lg p-4 bg-white border border-gray-100">
                      <h4 className="text-md font-medium text-gray-700 mb-3">3D Trajectory</h4>
                      <Plot
                        data={plotData.data}
                        layout={{
                          ...plotData.layout,
                          width: undefined,
                          height: 400,
                          margin: { t: 0, r: 0, l: 0, b: 0 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: {
                            family: 'Google Sans, arial, sans-serif',
                            color: '#5f6368'
                          }
                        }}
                        config={{ responsive: true }}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Analysis Results */}
                  {analysisResult && (
                    <div className="rounded-lg p-4 bg-white border border-gray-100">
                      <h4 className="text-md font-medium text-gray-700 mb-3">Video Analysis</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{analysisResult}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}