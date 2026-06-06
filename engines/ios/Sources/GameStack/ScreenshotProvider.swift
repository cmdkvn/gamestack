import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// Captures the current key-window frame as PNG or JPEG.
/// Main-thread only (renders a UIView hierarchy).
@MainActor
enum ScreenshotProvider {
    enum CaptureError: Error {
        case noWindow
        case renderFailed
        case unsupportedPlatform
    }

    static func capture(format: GameStackConfig.ScreenshotFormat, scale: CGFloat) throws -> Data {
        #if canImport(UIKit)
        guard let window = keyWindow() else { throw CaptureError.noWindow }
        let bounds = window.bounds
        let renderer: UIGraphicsImageRenderer = {
            let f = UIGraphicsImageRendererFormat()
            f.scale = scale
            f.opaque = false
            return UIGraphicsImageRenderer(bounds: bounds, format: f)
        }()
        let image = renderer.image { _ in
            window.drawHierarchy(in: bounds, afterScreenUpdates: false)
        }
        switch format {
        case .png:
            guard let data = image.pngData() else { throw CaptureError.renderFailed }
            return data
        case .jpeg:
            guard let data = image.jpegData(compressionQuality: 0.9) else { throw CaptureError.renderFailed }
            return data
        }
        #else
        throw CaptureError.unsupportedPlatform
        #endif
    }

    #if canImport(UIKit)
    private static func keyWindow() -> UIWindow? {
        guard Bundle.main.bundlePath.hasSuffix(".appex") == false else { return nil }
        for scene in UIApplication.shared.connectedScenes {
            guard let ws = scene as? UIWindowScene else { continue }
            if let key = ws.windows.first(where: { $0.isKeyWindow }) { return key }
            if let first = ws.windows.first { return first }
        }
        return nil
    }
    #endif
}
