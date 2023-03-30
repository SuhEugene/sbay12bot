import { EmitterWebhookEvent } from "@octokit/webhooks";
import { webhooks } from "../main.js";
import { issueAssigned } from "./issueAssigned.js";
import { issueClosed } from "./issueClosed.js";
import { issueComment } from "./issueComment.js";

webhooks.onAny(async data => {
  if (data.name == "issues" || data.name == "pull_request" || data.name == "issue_comment")
    console.log(`Catched hook ${data.name}.${data.payload.action} #${data.name == 'pull_request' ? data.payload.pull_request.number : data.payload.issue.number}`);

  if (data.name == "issues") {
    if (["closed", "reopened"].includes(data.payload.action))
      return await issueClosed(data as EmitterWebhookEvent<"issues.closed"> | EmitterWebhookEvent<"issues.reopened">);

    if (["assigned", "unassigned"].includes(data.payload.action))
      return await issueAssigned(data as EmitterWebhookEvent<"issues.assigned"> | EmitterWebhookEvent<"issues.unassigned">);
  }
  
  if (data.name == "issue_comment") {
    if (data.payload.action == "created")
      return await issueComment(data as EmitterWebhookEvent<"issue_comment.created">);
  }
});