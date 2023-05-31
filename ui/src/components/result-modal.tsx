import React from "react";
import { FileType, SearchResultDetails } from "./search-result";
import { ResultType, getBigIcon, TextPart } from "./search-result";
import { DataSourceType } from "../data-source";

export interface ResultModalProps {
  result: SearchResultDetails;
  dataSourceType: DataSourceType;
  closeModal: () => void;
}

export const ResultModal = (props: ResultModalProps) => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen flex flex-row justify-center items-center bg-[rgba(0,0,0,0.5)]">
      <div
        className="fixed top-0 left-0 w-screen h-screen z-10"
        onClick={props.closeModal}
      ></div>
      <div
        className="w-4/5 h-[85vh] flex flex-col justify-center items-center p-[20px] gap-[0px] z-20 bg-[#fff] rounded-[10px]"
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
              <span
                className={
                  (props.result.content[0].bold ? "font-bold text-black" : "") +
                  " text-md font-dm-sans font-regular"
                }
              >
                {props.result.content[0].content}
              </span>
              <span
                className={
                  (props.result.content[1].bold ? "font-bold text-black" : "") +
                  " text-md font-dm-sans font-regular"
                }
              >
                {props.result.content[1].content}
              </span>
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
              <a
                href={props.result.url}
                target="_blank"
                rel="noreferrer"
                className="w-full max-w-[250px] no-underline color text-white cursor-pointer"
              >
                <button className="w-full max-w-[250px] h-[45px] bg-[#0d7e97] text-white font-dm-sans font-bold rounded-[10px] cursor-pointer border-none outline-none">
                  Open
                </button>
              </a>
              <a
                className="text-black font-dm-sans"
                href={getDownloadUrl(props.result)}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            </div>
          </div>
          <button
            onClick={props.closeModal}
            className="text-2xl text-red-600 font-dm-sans font-bold"
          >
            &times;
          </button>
        </div>
        <iframe
          className="w-full h-full"
          src={getPreviewUrl(props.result)}
          allow="autoplay"
          allowFullScreen={true}
          title="Document Preview"
        />
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
  // If the url ends with "/edit", remove that
  let trimmedUrl = trimGoogleUrl(result.url);
  // add /preview
  let finalUrl = trimmedUrl + "/preview";
  return finalUrl;
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
