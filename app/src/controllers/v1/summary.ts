import type { Request, Response } from "express";
import OpenAI from "openai";
import Controller from "../../models/controller";

export default class SummaryController extends Controller {
  private openai: OpenAI;

  constructor() {
    super();

    this.openai = new OpenAI();
  }

  async handleIndex(req: Request, res: Response): Promise<void> {
    res.status(200).send({ data: "Hello from SummaryController!" });
  }

  async createSummary(req: Request, res: Response): Promise<void> {
    // Shouldn't happen, as this should be handled by middleware
    if (!req.auth) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }

    if (typeof req.body?.transcript !== "string") {
      res.status(400).send({ error: "Missing transcript" });
    }

    let aiContent: string | null;
    try {
      aiContent = await this.generateSummaryText(req.body.transcript as string);

      if (!aiContent) throw new Error();
    } catch (e) {
      res.status(500).send("OpenAI API error");
      return;
    }

    try {
      // Remove `created_by` from `summaryRecord` sent to user
      const { created_by, ...summaryRecord } = await this.db!.createSummary(
        req.auth.username,
        req.body.transcript as string,
        aiContent
      );

      // Send ID of new summary record to client
      res.status(200).send({ data: summaryRecord });
    } catch (error) {
      // TODO: Create catch-all error handling
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  }

  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      if (typeof req.params?.summaryId !== "string") {
        res.status(400).send({ error: "Missing or invalid summary ID param" });
        return;
      }

      const summary = await this.db!.getSummmary(
        req.params.summaryId as string
      );

      if (!summary) {
        res.status(404).send({ error: "Summary not found" });
        return;
      }

      const { created_by, ...summaryRecord } = summary;
      res.status(200).send({ data: summaryRecord });
    } catch (error) {
      console.error(error);
      res.status(404).send({ error: "Not Found" });
      return;
    }
  }

  /* HELPERS | TODO: Refactor into another file */

  private async generateSummaryText(
    transcript: string
  ): Promise<string | null> {
    const aiResponse = await this.openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Write detailed lecture notes based on the following transcript. Organize notes into sections, formatting information into lists, headings, and bullet points. Format response as Markdown.\n\n" +
            transcript,
        },
      ],
      model: "gpt-4-turbo-preview",
    });

    return aiResponse.choices[0].message.content;
  }
}
