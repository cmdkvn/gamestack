// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "GameStack",
    platforms: [
        .iOS(.v15),
        .tvOS(.v15),
        .macCatalyst(.v15),
    ],
    products: [
        .library(
            name: "GameStack",
            targets: ["GameStack"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "GameStack",
            path: "Sources/GameStack"
        ),
        .testTarget(
            name: "GameStackTests",
            dependencies: ["GameStack"],
            path: "Tests/GameStackTests"
        ),
    ]
)
