import * as fs from "node:fs/promises";
import * as core from "@actions/core";
import axios from "axios";
import { run } from "../src";

jest.mock("@actions/core");
jest.mock("node:fs/promises");
jest.mock("axios");

const mockConfig = `
text = "Hello world! Hello!"
find = "Hello"
replace = "Hi"
numbers = [1, 2, 3, 4, 5]
api_url = "https://api.example.com/data"
response_field = "important_field"
`;

describe("GitHub Action", () => {
    const mockGetInput = jest.spyOn(core, "getInput");
    const mockSetOutput = jest.spyOn(core, "setOutput");
    const mockSetFailed = jest.spyOn(core, "setFailed");
    const mockWarning = jest.spyOn(core, "warning");
    const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
    const mockAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;

    beforeEach(() => {
        jest.resetAllMocks();
        mockGetInput.mockReturnValue(".github/configs/setup-custom-action-by-ts.toml");
        mockReadFile.mockResolvedValue(mockConfig);
        mockAxiosGet.mockResolvedValue({ data: { important_field: "field_value" } });
    });

    it("should process text, count words, calculate sum and average, and fetch API data correctly", async () => {
        await run();

        expect(mockSetOutput).toHaveBeenCalledWith("processed_text", "Hi world! Hi!");
        expect(mockSetOutput).toHaveBeenCalledWith("word_count", 3);
        expect(mockSetOutput).toHaveBeenCalledWith("sum", 15);
        expect(mockSetOutput).toHaveBeenCalledWith("average", 3);
        expect(mockSetOutput).toHaveBeenCalledWith("response_field", "field_value");
    });

    it("should handle missing configuration file gracefully", async () => {
        mockReadFile.mockRejectedValue(new Error("File not found"));

        await run();

        expect(mockSetFailed).toHaveBeenCalledWith("Action failed with error: File not found");
    });

    it("should handle errors from API request gracefully", async () => {
        mockAxiosGet.mockRejectedValue(new Error("API error"));

        await run();

        expect(mockWarning).toHaveBeenCalledWith("API request failed: API error");
        expect(mockSetOutput).toHaveBeenCalledWith("response_field", "");
    });

    it("should use default values when config is empty", async () => {
        mockReadFile.mockResolvedValue("");

        await run();

        expect(mockSetOutput).toHaveBeenCalledWith("processed_text", "");
        expect(mockSetOutput).toHaveBeenCalledWith("word_count", 0);
        expect(mockSetOutput).toHaveBeenCalledWith("sum", 0);
        expect(mockSetOutput).toHaveBeenCalledWith("average", 0);
        expect(mockSetOutput).toHaveBeenCalledWith("response_field", "");
    });
});
