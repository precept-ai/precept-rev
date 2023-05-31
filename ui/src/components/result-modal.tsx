import React from "react";
import { FileType, SearchResultDetails } from "./search-result";
import { ResultType, getBigIcon } from "./search-result";
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
        className="w-4/5 h-[75vh] flex flex-row justify-center items-start p-[20px] gap-[30px] z-20 bg-[#fff] rounded-[10px]"
        onClick={() => {}}
      >
        <div className="w-[144px] h-[144px]">
          {getBigIcon({
            resultDetails: props.result,
            dataSourceType: props.dataSourceType,
          })}
        </div>
        <div className="w-full h-full flex flex-col items-start justify-between p-[10px] gap-[10px]">
          <h2 className="text-2xl text-[#0D7E97] font-bold font-dm-sans">
            {props.result.title}
          </h2>
          <div className="w-full h-full flex flex-col items-start justify-between gap-[10px] overflow-auto">
            {props.result.content.map((text_part, index) => (
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
          <div className="w-full flex flex-row items-end justify-between p-[10px] gap-[10px]">
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
        <iframe
          className="w-full h-full"
          src={getPreviewUrl(props.result)}
          allow="autoplay"
          allowFullScreen={true}
          title="Document Preview"
        />
        <button
          onClick={props.closeModal}
          className="text-2xl text-red-600 font-dm-sans font-bold"
        >
          &times;
        </button>
      </div>
    </div>
  );
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
