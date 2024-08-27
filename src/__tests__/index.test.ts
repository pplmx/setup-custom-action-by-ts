import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { run } from "../index";

jest.mock("@actions/core");
jest.mock("@actions/github");

describe("run", () => {
    const mockGetInput = getInput as jest.MockedFunction<typeof getInput>;
    const mockSetFailed = setFailed as jest.MockedFunction<typeof setFailed>;
    const mockGetOctokit = getOctokit as jest.MockedFunction<typeof getOctokit>;

    const mockAddLabels = jest.fn();
    const mockOctokit = {
        rest: {
            issues: {
                addLabels: mockAddLabels,
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetInput.mockImplementation((name) => {
            switch (name) {
                case "gh-token":
                    return "gh-token-value";
                case "label":
                    return "label-value";
                default:
                    return "";
            }
        });
        mockGetOctokit.mockReturnValue(mockOctokit as any);
        (context as any).payload = { pull_request: { number: 1 } };
        (context as any).repo = { owner: "owner", repo: "repo" };
    });

    it("should throw an error if not run on a pull request", async () => {
        (context as any).payload = {};

        await run();

        expect(mockSetFailed).toHaveBeenCalledWith("This action can only be run on Pull Requests");
    });

    it("should add label to the pull request", async () => {
        await run();

        expect(mockGetInput).toHaveBeenCalledWith("gh-token");
        expect(mockGetInput).toHaveBeenCalledWith("label");
        expect(mockGetOctokit).toHaveBeenCalledWith("gh-token-value");
        expect(mockAddLabels).toHaveBeenCalledWith({
            owner: "owner",
            repo: "repo",
            issue_number: 1,
            labels: ["label-value"],
        });
        expect(mockSetFailed).not.toHaveBeenCalled();
    });

    it("should handle error and set failed", async () => {
        mockAddLabels.mockRejectedValueOnce(new Error("Test error"));

        await run();

        expect(mockAddLabels).toHaveBeenCalledWith({
            owner: "owner",
            repo: "repo",
            issue_number: 1,
            labels: ["label-value"],
        });
        expect(mockSetFailed).toHaveBeenCalledWith("Test error");
    });
});
