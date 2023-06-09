import React, { useEffect, useState, useRef } from "react";
import { FileType, SearchResultDetails } from "./search-result";
import { ResultType, getBigIcon, TextPart } from "./search-result";
import { DataSourceType } from "../data-source";
import { Firestore } from "firebase/firestore";

import GoogleDoc from "../assets/images/google-doc.svg";
import Docx from "../assets/images/docx.svg";
import Pdf from "../assets/images/pdf.svg";
import Pptx from "../assets/images/pptx.svg";
import SlackLogo from "../assets/images/slack-logo.png";

export interface ResultModalProps {
  result: SearchResultDetails;
  dataSourceType: DataSourceType;
  closeModal: () => void;
  addRecentDoc?: (docToAdd: SearchResultDetails) => Promise<void>;
  db: Firestore;
}

export const ResultModal = (props: ResultModalProps) => {
  const [slackMessages, setSlackMessages] =
    useState<SlackMessagesResponse | null>();

  const [matchedMessage, setMatchedMessage] = useState<SlackMessage | null>();

  const matchedMessageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchedMessageRef.current) {
      matchedMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [matchedMessageRef.current]);

  useEffect(() => {
    const getSlackMessages = async () => {
      try {
        const { channel, ts } = getSlackUrlParams(props.result.url);
        try {
          const slackMessagesResponse = await fetch(
            "https://us-central1-precept-386815.cloudfunctions.net/get_slack_messages/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                channel: channel,
                ts: ts,
              }),
            }
          );
          const slackMessages: SlackMessagesResponse =
            await slackMessagesResponse.json();
          console.log(slackMessages);
          // Find the matched text manually
          let highestMatch: {
            numberOfMatches: number;
            match: SlackMessage;
          } | null = null;
          const matchedText = props.result.content[0].content;
          const matchedTextArray = matchedText.split(" ");
          for (const message of slackMessages.messages) {
            let numberOfMatches = 0;
            for (const word of matchedTextArray) {
              if (message.text.includes(word)) {
                numberOfMatches++;
              }
            }
            // If this is the first message, or if this messaage has a higher number of matches than the current highest match, set this as the highest match
            if (
              !highestMatch ||
              numberOfMatches > highestMatch.numberOfMatches
            ) {
              highestMatch = {
                numberOfMatches: numberOfMatches,
                match: message,
              };
            }
          }
          if (highestMatch) {
            setMatchedMessage(highestMatch.match);
          }
          console.log("highest match: ", highestMatch);
          setSlackMessages(slackMessages);
        } catch (e) {
          console.log("Error communicating with server for Slack messages");
        }
      } catch (e) {
        console.log("Error getting slack url params");
        console.log(e);
      }
    };
    if (props.result.data_source === "slack") {
      getSlackMessages();
    }
  }, []);

  const handleOpenClick = async (url: string) => {
    // Add the document to the recent documents list
    if (props.addRecentDoc) {
      await props.addRecentDoc(props.result);
      window.open(url, "_blank");
    }
  };
  return (
    <div className="fixed top-0 left-0 w-screen h-screen flex flex-row justify-center items-center bg-[rgba(0,0,0,0.5)]">
      <div
        className="fixed top-0 left-0 w-screen h-screen z-10"
        onClick={props.closeModal}
      ></div>
      <div
        className="w-4/5 h-[85vh] flex flex-col items-center p-[20px] gap-[0px] z-20 bg-[#fff] rounded-[10px]"
        onClick={() => {}}
      >
        <div className="w-full flex flex-row items-start p-[10px] gap-[20px]">
          <div className="">
            {getBigIcon({
              resultDetails: props.result,
              dataSourceType: props.dataSourceType,
            })}
          </div>
          <div className="w-full h-full flex flex-col items-start justify-between p-[10px] gap-[10px]">
            <h2 className="text-2xl text-[#0D7E97] font-bold font-dm-sans">
              {props.result.title}
            </h2>
            <div className="w-full h-full overflow-auto">
              {props.result.content[0] && (
                <span
                  className={
                    (props.result.content[0].bold
                      ? "font-bold text-black"
                      : "") + " text-md font-dm-sans font-regular"
                  }
                >
                  {props.result.content[0].content}
                </span>
              )}
              {props.result.content[1] && (
                <span
                  className={
                    (props.result.content[1].bold
                      ? "font-bold text-black"
                      : "") + " text-md font-dm-sans font-regular"
                  }
                >
                  {props.result.content[1].content}
                </span>
              )}
              {/* {convertToGroupsOfTwo(props.result.content).map(
                (groupOfTwo, index) => (
                  <div>
                    {groupOfTwo.map((text_part, index) => (
                      <span
                        key={index}
                        className={
                          (text_part.bold ? "font-bold text-black" : "") +
                          " text-md font-dm-sans font-regular"
                        }
                      >
                        {text_part.content}
                      </span>
                    ))}
                  </div>
                )
              )} */}
            </div>
            <div className="w-full flex flex-row items-center p-[10px] gap-[40px]">
              <button
                onClick={() => handleOpenClick(props.result.url)}
                className="w-full max-w-[250px] h-[45px] bg-[#0d7e97] text-white font-dm-sans font-bold rounded-[10px] cursor-pointer border-none outline-none"
              >
                Open
              </button>
              {props.result.data_source === "google_drive" && (
                <button
                  className="text-black font-dm-sans bg-[rgba(0,0,0,0)] cursor-pointer hover:underline"
                  onClick={() => handleOpenClick(getDownloadUrl(props.result))}
                >
                  Download
                </button>
              )}
            </div>
          </div>
          <button
            onClick={props.closeModal}
            className="text-2xl text-red-600 font-dm-sans font-bold"
          >
            &times;
          </button>
        </div>

        {props.result.data_source === "google_drive" && (
          <iframe
            className="w-full h-full border-0"
            src={getPreviewUrl(props.result)}
            allow="autoplay"
            allowFullScreen={true}
            title="Document Preview"
          />
        )}
        {props.result.data_source === "slack" &&
          (slackMessages ? (
            <div className="w-full h-full overflow-hidden flex flex-col gap-[20px]">
              <div className="flex flex-col w-full sticky">
                <div className="w-full px-[10px] flex flex-row items-center gap-[10px] py-[20px] bg-[#350D36] border-b-[2px] border-b-[rgba(0,0,0,0.2)]">
                  <img src={SlackLogo} alt="Slack Logo" className="w-[32px]" />
                  <span className="font-larsseit font-bold text-2xl text-white">
                    Slack
                  </span>
                </div>
                <div className="w-full px-[10px] py-[20px] bg-white border-b-[2px] border-b-[rgba(0,0,0,0.2)]">
                  <span className="font-dm-sans font-bold text-xl">
                    #{props.result.location}
                  </span>
                </div>
              </div>
              <div className="w-full h-full overflow-y-scroll flex flex-col gap-[20px]">
                {slackMessages.messages.map((message, index) => (
                  <div
                    key={index}
                    className={
                      "w-full flex flex-row items-start p-[10px] gap-[2px] " +
                      (matchedMessage && matchedMessage.ts === message.ts
                        ? "bg-[rgba(13,126,151,0.12)] font-bold"
                        : "")
                    }
                    ref={
                      matchedMessage && matchedMessage.ts === message.ts
                        ? matchedMessageRef
                        : null
                    }
                  >
                    <div className="flex flex-row gap-[10px]">
                      {message.user.image_48 && (
                        <img
                          src={message.user.image_48}
                          alt={message.user.display_name}
                          className="w-[48px] h-[48px] rounded-[10px]"
                        />
                      )}
                    </div>
                    <div className="w-full flex flex-col items-start px-[10px] gap-[4px]">
                      {message.user.display_name ? (
                        <span className="text-md font-dm-sans font-bold">
                          {message.user.display_name}
                        </span>
                      ) : (
                        <span className="text-md font-dm-sans font-bold">
                          {message.user.first_name}
                        </span>
                      )}
                      {message.text &&
                        (!message.subtype ||
                          message.subtype !== "channel_join") && (
                          <span className={"text-md font-dm-sans font-regular"}>
                            {message.text}
                          </span>
                        )}
                      {message.files &&
                        message.files.map((file, index) => (
                          <div
                            key={index}
                            className="w-full h-full min-w-[150px] max-w-[300px] flex flex-col items-start p-[24px] gap-[24px] rounded-[10px] border-[1px] border-[rgba(0,0,0,0.1)]"
                          >
                            <div className="flex flex-row items-end gap-[10px]">
                              {file.mimetype && (
                                <img
                                  src={
                                    file.mimetype === "application/pdf"
                                      ? Pdf
                                      : file.mimetype ===
                                        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                      ? Pptx
                                      : ""
                                  }
                                  alt={file.name}
                                  className="h-[48px] w-[48px]"
                                />
                              )}
                              <div className="flex flex-col gap-[2px]">
                                <span
                                  className={
                                    "text-md font-dm-sans font-bold line-clamp-1"
                                  }
                                >
                                  {file.name}
                                </span>
                                {file.filetype && (
                                  <span className="line-clamp-1">
                                    {file.filetype.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleOpenClick(file.url_private_download)
                              }
                              className="w-full h-[45px] bg-[rgba(0,0,0,0.04)] text-black font-dm-sans font-bold rounded-[10px] cursor-pointer border-none outline-none hover:bg-[rgba(13,126,151,0.12)] hover:text-[#0d7e97]"
                            >
                              Open in Slack
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p>Loading</p>
            </>
          ))}
      </div>
    </div>
  );
};

const convertToGroupsOfTwo = (content: TextPart[]) => {
  let groupsOfTwo: TextPart[][] = [];
  let currentGroup: TextPart[] = [];
  for (let i = 0; i < content.length; i++) {
    if (currentGroup.length === 2) {
      groupsOfTwo.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(content[i]);
  }
  if (currentGroup.length > 0) {
    groupsOfTwo.push(currentGroup);
  }
  return groupsOfTwo;
};

const getDownloadUrl = (result: SearchResultDetails) => {
  // If the url ends with "/edit", remove that
  let trimmedUrl = trimGoogleUrl(result.url);
  // add /export
  let finalUrl = trimmedUrl + "/export";
  // Find out what type of file it is
  if (result.file_type === FileType.GoogleDoc) {
    finalUrl += "?format=docx";
  } else if (result.file_type === FileType.Pdf) {
    // Need to get the id of the file
    const fileId = trimmedUrl.match(/[-\w]{25,}(?!.*[-\w]{25,})/);
    finalUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
  } else if (result.file_type === FileType.Pptx) {
    finalUrl += "?format=pptx";
  }
  return finalUrl;
};

const getPreviewUrl = (result: SearchResultDetails) => {
  if (result.data_source === "google_drive") {
    // If the url ends with "/edit", remove that
    let trimmedUrl = trimGoogleUrl(result.url);
    // add /preview
    let finalUrl = trimmedUrl + "/preview";
    return finalUrl;
  }
};

const trimGoogleUrl = (url: string) => {
  // If the url ends with "/edit", remove that
  let trimmedUrl = url.split("/edit")[0];
  // If the url ends with "/view", remove that
  trimmedUrl = trimmedUrl.split("/view")[0];
  // If the trimmed url ends with "/" because there was no "/edit" at the end, remove the "/"
  if (trimmedUrl.charAt(trimmedUrl.length - 1) === "/") {
    trimmedUrl = trimmedUrl.substring(0, trimmedUrl.length - 1);
  }
  return trimmedUrl;
};

const getSlackUrlParams = (slackUrl: string) => {
  const url = new URLSearchParams(slackUrl);
  const channel = slackUrl.split("channel=")[1].split("&")[0];
  const ts = url.get("message_ts");
  if (!ts) {
    throw new Error("ts not found in slack url");
  }
  if (!channel) {
    throw new Error("channel not found in slack url");
  }
  return { channel, ts };
};

interface SlackBlock {
  type: string;
  block_id: string;
  elements: SlackBlockElement[];
}

interface SlackBlockElement {
  type: string;
  elements: SlackBlockTextElement[];
}

interface SlackBlockTextElement {
  type: string;
  text: string;
}

interface UserDetails {
  display_name?: string;
  first_name?: string;
  image_48?: string;
  id?: string;
}

interface SlackFile {
  id: string;
  created: number;
  timestamp: number;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  pretty_type: string;
  user: string;
  user_team: string;
  editable: boolean;
  size: number;
  mode: string;
  is_external: boolean;
  external_type: string;
  is_public: boolean;
  public_url_shared: boolean;
  display_as_bot: boolean;
  username: string;
  url_private: string;
  url_private_download: string;
  media_display_type: string;
  thumb_pdf: string;
  thumb_pdf_w: number;
  thumb_pdf_h: number;
  permalink: string;
  permalink_public: string;
  is_starred: boolean;
  has_rich_preview: boolean;
  file_access: string;
}

interface SlackMessage {
  type: string;
  subtype?: string;
  ts: string;
  user: UserDetails;
  text: string;
  blocks?: SlackBlock[];
  files?: SlackFile[];
  upload?: boolean;
  display_aw_bot?: boolean;
  client_msg_id?: string;
}

interface SlackMessagesResponse {
  messages: SlackMessage[];
  currentMessage: SlackMessage;
}
