import XCTest
@testable import GameStack

final class HTTPResponseTests: XCTestCase {
    func testJSONResponseSerializesHeadCorrectly() throws {
        let response = HTTPResponse.json(["ok": true])
        let head = response.serializeHead()
        let str = String(data: head, encoding: .utf8) ?? ""
        XCTAssertTrue(str.hasPrefix("HTTP/1.1 200 OK\r\n"), "got: \(str)")
        XCTAssertTrue(str.contains("content-type: application/json"))
        XCTAssertTrue(str.contains("content-length:"))
        XCTAssertTrue(str.contains("connection: close"))
        XCTAssertTrue(str.hasSuffix("\r\n\r\n"))
    }

    func testNotFoundUsesCorrectStatus() throws {
        let response = HTTPResponse.notFound
        let head = response.serializeHead()
        let str = String(data: head, encoding: .utf8) ?? ""
        XCTAssertTrue(str.hasPrefix("HTTP/1.1 404 Not Found\r\n"), "got: \(str)")
    }

    func testBinaryResponseSetsContentType() throws {
        let bytes = Data([0x89, 0x50, 0x4E, 0x47])
        let response = HTTPResponse.binary(bytes, contentType: "image/png")
        XCTAssertEqual(response.body, bytes)
        let head = String(data: response.serializeHead(), encoding: .utf8) ?? ""
        XCTAssertTrue(head.contains("content-type: image/png"))
        XCTAssertTrue(head.contains("content-length: 4"))
    }
}
