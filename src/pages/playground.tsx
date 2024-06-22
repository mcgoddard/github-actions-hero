import * as React from "react";

import { Button, Flash, SelectMenu, Tooltip } from "@primer/components";
import {
  CheckIcon,
  ChevronDownIcon,
  ClippyIcon,
} from "@primer/octicons-v2-react";
import {
  Event,
  ExpressionError,
  ParseError,
  RuntimeModel,
  WorkflowExecution,
  parse,
  run,
} from "../github-actions-interpreter";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import { DynamicEditor } from "../components/dynamicEditor";
import Link from "next/link";
import { NextPage } from "next";
import { PlaygroundWorkflows } from "../playground/workflows";
import { YAMLException } from "js-yaml";
import { useRouter } from "next/router";
import { wait } from "../utils/wait";
import { EventConfiguration } from "../components/eventConfiguration";

const defaultEventConfiguration: { [key: string]: Event } = {
  push: {
    event: "push",
    branch: "master",
    files: [],
  },
  pull_request: {
    event: "pull_request",
    branch: "feature-branch",
    action: "opened",
    files: [],
  },
  issues: {
    event: "issues",
    action: "closed",
  },
};

const PlaygroundPage: NextPage = () => {
  const { query } = useRouter();

  React.useEffect(() => {
    const w: string | undefined = query.w as string;
    console.log(w);
    if (w) {
      const workflowText = decompressFromEncodedURIComponent(w);
      if (workflowText) {
        setSelectedWorkflow({
          name: "Custom",
          workflow: workflowText,
        });
        setInput(workflowText);
      }
    }
    const e: string | undefined = query.e as string;
    console.log(e);
    if (e) {
      const eventText = decompressFromEncodedURIComponent(e);
      if (eventText) {
        const event = JSON.parse(eventText);
        setEventConfiguration(event);
      }
    }
  }, [query]);

  const [selectedWorkflow, setSelectedWorkflow] = React.useState(
    PlaygroundWorkflows[0]
  );
  const [eventConfiguration, setEventConfiguration] = React.useState<Record<number, Event>>({0: defaultEventConfiguration["push"]});
  const [input, setInput] = React.useState(selectedWorkflow.workflow);
  const [copied, setCopied] = React.useState(false);
  const copyContent = React.useCallback(async () => {
    const workflowUrlContent = compressToEncodedURIComponent(input);
    const eventUrlContent = compressToEncodedURIComponent(JSON.stringify(eventConfiguration));
    const url = `https://github-actions-hero.now.sh/playground?w=${workflowUrlContent}&e=${eventUrlContent}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    await wait(2000);
    setCopied(false);
  }, [input]);

  let err: Error | undefined;
  let workflowExecution: { [trigger: string]: RuntimeModel } = {};

  try {
    const parsedWorkflow = parse(input);

    for (const [index, event] of Object.entries(eventConfiguration)) {
      const result = run(
        event,
        `.github/workflows/workflow.yaml`,
        parsedWorkflow
      );

      workflowExecution[index] = result;
    };

    err = undefined;
  } catch (e) {
    workflowExecution = {};
    err = e;
  }

  const resetEventTypeConfiguration = (index, eventType) => {
    const newEventConfiguration = { ...eventConfiguration };
    newEventConfiguration[index] = defaultEventConfiguration[eventType];
    setEventConfiguration(newEventConfiguration);
  }

  const setSelectedBranch = (index, changeEvent) => {
    const newEventConfiguration = { ...eventConfiguration[index] };
    if (newEventConfiguration.event === "pull_request" || newEventConfiguration.event === "push") {
      newEventConfiguration.branch = changeEvent.target.value;
      const newConfig = { ...eventConfiguration };
      newConfig[index] = newEventConfiguration;
      setEventConfiguration(newConfig);
    }
  }

  const setSelectedFiles = (index, changeEvent) => {
    const newEventConfiguration = { ...eventConfiguration[index] };
    if (newEventConfiguration.event === "pull_request" || newEventConfiguration.event === "push") {
      newEventConfiguration.files = changeEvent.target.value.split(", ");
      const newConfig = { ...eventConfiguration };
      newConfig[index] = newEventConfiguration;
      setEventConfiguration(newConfig);
    }
  }

  const setSelectedActionType = (index, actionType) => {
    const newEventConfiguration = { ...eventConfiguration[index] };
    if (newEventConfiguration.event === "pull_request" || newEventConfiguration.event === "issues") {
      newEventConfiguration.action = actionType;
      const newConfig = { ...eventConfiguration };
      newConfig[index] = newEventConfiguration;
      setEventConfiguration(newConfig);
    }
  }

  const addEvent = () => {
    const newEventConfiguration = { ...eventConfiguration };
    const newIndex = Object.keys(newEventConfiguration).length;
    newEventConfiguration[newIndex] = defaultEventConfiguration["push"];
    setEventConfiguration(newEventConfiguration);
  };

  const removeEvent = (index) => {
    const newEventConfiguration = { ...eventConfiguration };
    delete newEventConfiguration[index];
    setEventConfiguration(newEventConfiguration);
  };

  return (
    <div className="flex flex-row h-screen">
      <div
        className="flex-1 flex flex-col p-6 h-screen overflow-auto"
        style={{
          minWidth: "45vw",
        }}
      >
        <div className="flex justify-center text-center">
          <Link href="/">
            <a>
              <h1>GitHub Actions Hero</h1>
            </a>
          </Link>
        </div>
        <div className="flex items-center my-3">
          <div className="flex-1 justify-start">
            <h2>Playground</h2>
          </div>
          <div className="flex flex-initial justify-end">
            <SelectMenu>
              <Button as="summary">
                Workflow: {selectedWorkflow.name} <ChevronDownIcon />
              </Button>
              <SelectMenu.Modal>
                <SelectMenu.Header>Example workflows</SelectMenu.Header>
                <SelectMenu.List>
                  {PlaygroundWorkflows.map((pw) => (
                    <SelectMenu.Item
                      key={pw.name}
                      selected={pw === selectedWorkflow}
                      onClick={(ev) => {
                        setSelectedWorkflow(pw);
                        setInput(pw.workflow);
                      }}
                    >
                      {pw.name}
                    </SelectMenu.Item>
                  ))}
                </SelectMenu.List>
              </SelectMenu.Modal>
            </SelectMenu>
            <Tooltip text="Copy link to clipboard" direction="w">
              <Button className="ml-2" onClick={() => copyContent()}>
                {copied ? (
                  <CheckIcon className="text-green-600" />
                ) : (
                  <ClippyIcon />
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-col">
          <DynamicEditor
            workflow={selectedWorkflow.workflow}
            change={(v) => setInput(v)}
            everythingEditable={true}
          />
        </div>

        <div className="flex items-center my-3">
          <div className="flex-1 justify-start">
            <h2>Event</h2>
          </div>
          <div className="flex flex-initial justify-end">
            <Button onClick={addEvent}>+</Button>
          </div>
        </div>

        {Object.entries(eventConfiguration).map(([index, event]) => (
          <EventConfiguration
            key={index}
            event={event}
            resetEventTypeConfiguration={(eventType) => resetEventTypeConfiguration(index, eventType)}
            setSelectedBranch={(branchName => setSelectedBranch(index, branchName))}
            setSelectedFiles={files => setSelectedFiles(index, files)}
            setSelectedActionType={action => setSelectedActionType(index, action)}
            removeEvent={() => removeEvent(index)}
            />
        ))}

        {err && (
          <div className="mt-2">
            <Flash scheme="red">
              {(() => {
                switch (true) {
                  case err instanceof YAMLException:
                    return <div>Parsing error: {err.message}</div>;

                  case err instanceof ParseError:
                    return <div>Validation error: {err.message}</div>;

                  case err instanceof ExpressionError:
                    return <div>Expression error: {err.message}</div>;

                  default:
                    console.error(err);
                    return <div>{err.message}</div>;
                }
              })()}
            </Flash>
          </div>
        )}
      </div>

      <div className="flex-1 bg-gray-300 p-3 h-screen overflow-auto flex flex-row justify-center flex-wrap">
        {Object.entries(eventConfiguration).map(([index, event], idx) => (
          <WorkflowExecution
            key={index}
            id={idx}
            events={[event]}
            executionModel={workflowExecution[index]}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaygroundPage;
