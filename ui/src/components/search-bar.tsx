import * as React from "react";

import ClipLoader from "react-spinners/ClipLoader";
import { BsSearch, BsXLg } from "react-icons/bs";
import { getSearchHistorySuggestions } from "../autocomplete";

export interface SearchBarState {
  suggestions: string[];
  hideSuggestions: boolean;
  activeSuggestion: number;
}

export interface SearchBarProps {
  query: string;
  widthPercentage: number;
  isLoading: boolean;
  isDisabled: boolean;
  showReset: boolean;
  showSuggestions: boolean;
  onSearch: () => void;
  onQueryChange: (query: string) => void;
  onClear: () => void;
}

export default class SearchBar extends React.Component<
  SearchBarProps,
  SearchBarState
> {
  constructor(props) {
    super(props);
    this.state = {
      activeSuggestion: 0,
      hideSuggestions: false,
      suggestions: [],
    };
  }

  getBorderGradient() {
    if (this.props.isDisabled) {
      return "from-[#222222] via-[#333333] to-[#222222]";
    }
    return "from-[#8E59D1] via-[#85a6ec] to-[#b385ec]";
  }

  render() {
    return (
      <div
        style={{ width: `${this.props.widthPercentage}%` }}
        className={`h-[49.5px] rounded-[30px] bg-[#fff] ${this.getBorderGradient()}`}
      >
        <div className="flex h-12 w-full items-center container text-3xl rounded-[30px] bg-[#fff] text-[#C9C9C9]">
          <button
            onClick={this.search}
            className="mx-2 text-white p-2 rounded
                  hover:text-[#493294] transition duration-500 ease-in-out flex items-center"
          >
            {this.props.isLoading ? (
              <ClipLoader
                color="#0D7E97"
                loading={this.props.isLoading}
                size={25}
                aria-label="Loading Spinner"
              />
            ) : (
              <BsSearch
                size={20}
                className="text-[#D2D2D2] hover:text-[#ebebeb] hover:cursor-pointer"
              ></BsSearch>
            )}
          </button>

          <input
            disabled={this.props.isDisabled}
            type="text"
            className="w-full font-dm-sans font-medium leading-7 text-lg p-2 rounded text-[#000] bg-transparent !outline-none"
            placeholder="Search"
            value={this.props.query}
            onChange={this.handleChange}
            onKeyDown={this.onKeyDown}
          />
          {this.props.showReset && (
            <BsXLg
              onClick={this.props.onClear}
              size={23}
              className="text-[#8E8C8C] mr-4 hover:text-[#c1bebe] hover:cursor-pointer"
            ></BsXLg>
          )}
        </div>
        {!this.state.hideSuggestions &&
          this.props.showSuggestions &&
          this.props.query.length > 2 && (
            <div className="relative bg-[#2A2A2A] w-full mt-[-14px] rounded-xl z-20">
              {this.state.suggestions.map((suggestion, index) => {
                return (
                  <div
                    onClick={() => this.onSuggestionClick(suggestion)}
                    key={index}
                    className={
                      "text-[#C9C9C9] font-dm-sans font-medium text-lg mt-2 hover:bg-[#919191] p-1 py-2 cursor-pointer" +
                      (this.state.activeSuggestion === index
                        ? " bg-[#C2C2C2] border-l-[#fff] rounded-l-sm border-l-[3px]"
                        : "")
                    }
                  >
                    <span className="ml-4 text-[#fff]">{this.props.query}</span>
                    <span className="text-gray-400">{suggestion}</span>
                  </div>
                );
              })}
              {this.state.suggestions.length > 1 && (
                <div className="relative right-0 text-right mr-4 text-black text-xs">
                  Use arrows ↑ ↓ to navigate
                </div>
              )}
            </div>
          )}
      </div>
    );
  }

  search = () => {
    this.setState({ hideSuggestions: true, activeSuggestion: 0 });
    this.props.onSearch();
  };

  onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (this.state.activeSuggestion > 0) {
        await this.props.onQueryChange(
          this.props.query + this.state.suggestions[this.state.activeSuggestion]
        );
      }
      this.search();
    } else if (event.key === "Escape") {
      this.setState({ hideSuggestions: true, activeSuggestion: 0 });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (this.state.activeSuggestion < this.state.suggestions.length - 1) {
        this.setState({ activeSuggestion: this.state.activeSuggestion + 1 });
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (this.state.activeSuggestion > 0) {
        this.setState({ activeSuggestion: this.state.activeSuggestion - 1 });
      }
    }
  };

  onSuggestionClick = (suggestion: string) => {
    this.props.onQueryChange(this.props.query + suggestion);
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let query = event.target.value;
    this.props.onQueryChange(query);
    this.setState({ hideSuggestions: false });
    this.setState({ suggestions: ["", ...getSearchHistorySuggestions(query)] });
  };
}
