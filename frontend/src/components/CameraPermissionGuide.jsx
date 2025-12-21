import { Camera, Smartphone, Settings } from 'lucide-react';

export default function CameraPermissionGuide() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 animate-slide-up">
            <h3 className="font-bold text-lg text-blue-900 mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Camera Access Required
            </h3>

            <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                    <Smartphone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>On Mobile:</strong> Your browser will ask for camera permission.
                        Please tap "Allow" to use the camera feature.
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <Settings className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>Already Blocked?</strong> Go to browser settings →
                        Site permissions → Camera → Allow for this site.
                    </div>
                </div>

                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs">
                        💡 <strong>Desktop users:</strong> Make sure you have a webcam connected.
                        For best results on mobile, use the back camera.
                    </p>
                </div>
            </div>
        </div>
    );
}
