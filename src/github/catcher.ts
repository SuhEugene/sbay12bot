import { EmitterWebhookEvent } from "@octokit/webhooks";
import { webhooks } from "../main.js";
import { issueAssigned } from "./issueAssigned.js";
import { issueClosed } from "./issueClosed.js";

webhooks.onAny(async data => {
  if (data.name == "issues" || data.name == "pull_request")
    console.log(`Catched hook ${data.name}.${data.payload.action} #${data.name == 'issues' ? data.payload.issue.number : data.payload.pull_request.number}`);

  if (data.name == "issues") {
    if (["closed", "reopened"].includes(data.payload.action))
      return await issueClosed(data as EmitterWebhookEvent<"issues.closed"> | EmitterWebhookEvent<"issues.reopened">);

    if (["assigned", "unassigned"].includes(data.payload.action))
      return await issueAssigned(data as EmitterWebhookEvent<"issues.assigned"> | EmitterWebhookEvent<"issues.unassigned">);
  }
  
});