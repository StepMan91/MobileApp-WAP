'use client';

import { useState, useRef, useEffect } from 'react';

export default function Camera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState<number>(50);
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            setImageBlob(blob);
                            setPreviewUrl(URL.createObjectURL(blob));
                            stopCamera();
                        }
                    },
                    'image/jpeg',
                    0.8 // Quality
                );
            }
        }
    };

    const retake = () => {
        setImageBlob(null);
        setPreviewUrl(null);
        setAiResponse(null);
        startCamera();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageBlob) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('image', imageBlob, 'capture.jpg');
        formData.append('comment', comment);
        formData.append('rating', rating.toString());

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setAiResponse(data.ai_response || 'Analysis complete!');
            } else {
                console.error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto p-4">
            <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden mb-4 shadow-lg">
                {!imageBlob ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img src={previewUrl!} alt="Preview" className="w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {!imageBlob ? (
                <button
                    onClick={captureImage}
                    className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg active:scale-95 transition-transform"
                    aria-label="Capture"
                />
            ) : (
                <div className="w-full space-y-4">
                    {!aiResponse ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rating: {rating}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    rows={3}
                                    placeholder="Add a comment..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={retake}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Retake
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Analyzing...' : 'Submit Analysis'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                            <h3 className="font-bold text-green-800 mb-2">AI Analysis Result</h3>
                            <p className="text-green-700">{aiResponse}</p>
                            <button
                                onClick={retake}
                                className="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Start New Analysis
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
