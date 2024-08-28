import * as fs from "node:fs/promises";
import * as core from "@actions/core";
import axios from "axios";
import * as toml from "toml";

interface Config {
    text?: string;
    find?: string;
    replace?: string;
    numbers?: number[];
    api_url?: string;
    response_field?: string;
}

export async function run(): Promise<void> {
    try {
        const configPath = core.getInput("config_path") || ".github/configs/setup-custom-action-by-ts.toml";

        const configContent = await fs.readFile(configPath, "utf-8");
        const config: Config = toml.parse(configContent);

        const {
            text = "",
            find = "",
            replace = "",
            numbers = [],
            api_url: apiUrl = "",
            response_field: responseField = "",
        } = config;

        const processedText = text.replace(new RegExp(find, "g"), replace);
        const wordCount = processedText.trim() === "" ? 0 : processedText.trim().split(/\s+/).length;

        const sum = numbers.reduce((acc: number, num: number) => acc + num, 0);
        const average = numbers.length > 0 ? sum / numbers.length : 0;

        let responseFieldValue = "";
        if (apiUrl && responseField) {
            try {
                const { data } = await axios.get<Record<string, unknown>>(apiUrl);
                responseFieldValue = (data[responseField] as string) ?? "";
            } catch (error) {
                core.warning(`API request failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        core.setOutput("processed_text", processedText);
        core.setOutput("word_count", wordCount);
        core.setOutput("sum", sum);
        core.setOutput("average", average);
        core.setOutput("response_field", responseFieldValue);
    } catch (error) {
        core.setFailed(`Action failed with error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

if (!process.env.JEST_WORKER_ID) {
    run().catch((error) => {
        console.error("Unhandled error:", error);
        process.exit(1);
    });
}
