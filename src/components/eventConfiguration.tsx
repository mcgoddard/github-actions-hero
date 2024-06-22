import * as React from "react";
import { Button, SelectMenu, TextInput } from "@primer/components";
import { ChevronDownIcon } from "@primer/octicons-v2-react";
import {
  Event,
} from "../github-actions-interpreter";
import { ChangeEvent } from "react";

type EventConfigurationProps = {
  event: Event;
  resetEventTypeConfiguration: (eventType: string) => void;
  setSelectedBranch: (branch: ChangeEvent<HTMLInputElement>) => void;
  setSelectedFiles: (files: ChangeEvent<HTMLInputElement>) => void;
  setSelectedActionType: (actionType: string) => void;
  removeEvent: () => void;
};

export const EventConfiguration: React.FC<EventConfigurationProps> = ({
  event,
  resetEventTypeConfiguration,
  setSelectedBranch,
  setSelectedFiles,
  setSelectedActionType,
  removeEvent,
}) => {
  return (
    <div className="flex items-center my-3">
      <SelectMenu>
      <Button as="summary">
        Event type: {event.event} <ChevronDownIcon />
      </Button>
      <SelectMenu.Modal>
        <SelectMenu.List>
        {["push", "pull_request", "issues"].map((eventType) => (
            <SelectMenu.Item
            key={eventType}
            selected={eventType === event.event}
            onClick={() => {
                resetEventTypeConfiguration(eventType);
            }}
            >
            {eventType}
            </SelectMenu.Item>
        ))}
        </SelectMenu.List>
        </SelectMenu.Modal>
      </SelectMenu>
      {(event.event === "push" || event.event === "pull_request") && (
      <>
        <TextInput aria-label="Branch name" name="branch-name" placeholder="Branch name" value={event.branch} onChange={setSelectedBranch} className="ml-2" />
        <TextInput aria-label="File" name="files" placeholder="Files" value={event.files?.join(", ")} onChange={setSelectedFiles} className="ml-2"/>
      </>
      )}
      {event.event === "pull_request" && (
      <SelectMenu className="ml-2">
          <Button as="summary">
          Action: {event.action} <ChevronDownIcon />
          </Button>
          <SelectMenu.Modal>
          <SelectMenu.List>
              {[
              "assigned",
              "unassigned",
              "labeled",
              "unlabeled",
              "opened",
              "edited",
              "closed",
              "reopened",
              "synchronize",
              "ready_for_review",
              "locked",
              "unlocked",
              "review_requested",
              "review_request_removed"
              ].map((actionType) => (
              <SelectMenu.Item
                  key={actionType}
                  selected={actionType === event.action}
                  onClick={() => {
                  setSelectedActionType(actionType);
                  }}
              >
                  {actionType}
              </SelectMenu.Item>
              ))}
          </SelectMenu.List>
          </SelectMenu.Modal>
      </SelectMenu>
      )}
      {event.event === "issues" && (
      <SelectMenu className="ml-2">
          <Button as="summary">
          Action: {event.action} <ChevronDownIcon />
          </Button>
          <SelectMenu.Modal>
          <SelectMenu.List>
              {[
              "opened",
              "edited",
              "deleted",
              "transferred",
              "pinned",
              "unpinned",
              "closed",
              "reopened",
              "assigned",
              "unassigned",
              "labeled",
              "unlabeled",
              "locked",
              "unlocked",
              "milestoned",
              "demilestoned",
              ].map((actionType) => (
              <SelectMenu.Item
                key={actionType}
                selected={actionType === event.action}
                onClick={() => {
                  setSelectedActionType(actionType);
                }}
              >
                {actionType}
              </SelectMenu.Item>
              ))}
          </SelectMenu.List>
        </SelectMenu.Modal>
      </SelectMenu>
    )}
    <Button className="ml-2" onClick={removeEvent}>-</Button>
    </div>
  );
};
