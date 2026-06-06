import XCTest
@testable import GameStack

final class HTTPRequestTests: XCTestCase {
    func testParsesSimpleGetRequest() throws {
        let raw = "GET /state HTTP/1.1\r\nHost: localhost:7333\r\n\r\n"
        let data = Data(raw.utf8)
        let parsed = HTTPRequest.parse(from: data)
        XCTAssertNotNil(parsed)
        XCTAssertEqual(parsed?.request.method, "GET")
        XCTAssertEqual(parsed?.request.path, "/state")
        XCTAssertEqual(parsed?.request.body.count, 0)
        XCTAssertEqual(parsed?.request.headers["host"], "localhost:7333")
    }

    func testParsesPostWithBody() throws {
        let body = "{\"id\":\"snap-1\"}"
        let raw = "POST /restore HTTP/1.1\r\ncontent-length: \(body.count)\r\ncontent-type: application/json\r\n\r\n\(body)"
        let data = Data(raw.utf8)
        let parsed = HTTPRequest.parse(from: data)
        XCTAssertNotNil(parsed)
        XCTAssertEqual(parsed?.request.method, "POST")
        XCTAssertEqual(parsed?.request.path, "/restore")
        XCTAssertEqual(String(data: parsed?.request.body ?? Data(), encoding: .utf8), body)
    }

    func testParsesQueryString() throws {
        let raw = "GET /state?depth=3&format=json HTTP/1.1\r\n\r\n"
        let data = Data(raw.utf8)
        let parsed = HTTPRequest.parse(from: data)
        XCTAssertEqual(parsed?.request.path, "/state")
        XCTAssertEqual(parsed?.request.query["depth"], "3")
        XCTAssertEqual(parsed?.request.query["format"], "json")
    }

    func testReturnsNilWhenBodyNotFullyArrived() throws {
        let raw = "POST /snapshot HTTP/1.1\r\ncontent-length: 100\r\n\r\n{\"partial\":"
        let data = Data(raw.utf8)
        let parsed = HTTPRequest.parse(from: data)
        XCTAssertNil(parsed, "Parser should wait for the full content-length to arrive")
    }

    func testReturnsNilOnMalformedRequestLine() throws {
        let raw = "garbage data\r\n\r\n"
        let parsed = HTTPRequest.parse(from: Data(raw.utf8))
        XCTAssertNil(parsed)
    }
}
