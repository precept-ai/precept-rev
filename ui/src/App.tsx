import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import posthog from "posthog-js";
import { Tooltip } from "react-tooltip";

import EnterImage from "./assets/images/enter-white.svg";
import WarningImage from "./assets/images/warning.svg";
import DiscordImage from "./assets/images/discord.png";

import PreceptLogo from "./assets/images/precept-logo.png";
import GoogleDrivePng from "./assets/images/Drive-png.png";
import { ReactComponent as SearchIcon } from "./assets/images/search-icon.svg";
import { ReactComponent as ProfileIcon } from "./assets/images/profile-icon.svg";
import { ReactComponent as SettingsIcon } from "./assets/images/settings-icon.svg";
import { ReactComponent as DataIcon } from "./assets/images/data-icon.svg";
import { ReactComponent as LogoutIcon } from "./assets/images/logout-icon.svg";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { firebaseConfig } from "./components/firebase-config";

import GoogleLoginButton from "./assets/images/google-login.png";
import MicrosoftLoginButton from "./assets/images/microsoft-login.png";

import "./assets/css/App.css";
import SkeletonLoader from "./components/skeleton-loader";
import SearchBar from "./components/search-bar";
import {
  FileType,
  ResultType,
  SearchResult,
  SearchResultDetails,
  getBigIcon,
} from "./components/search-result";
import { ResultModal } from "./components/result-modal";
import { addToSearchHistory } from "./autocomplete";
import DataSourcePanel from "./components/data-source-panel";
import Modal from "react-modal";
import { api } from "./api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import { FiSettings } from "react-icons/fi";
import { AiFillWarning } from "react-icons/ai";
import {
  ConnectedDataSource,
  DataSourceType,
  HTMLInputType,
} from "./data-source";
import { IoMdArrowDropdown, IoMdClose } from "react-icons/io";
import ProgressBar from "@ramonak/react-progress-bar";
import AddOrganisation from "./components/add-organisation";

export interface AppState {
  authed: boolean | "loading";
  user: User | null;
  userDoc: UserDoc | null | "loading";
  query: string;
  results: SearchResultDetails[];
  searchDuration: number;
  dataSourceTypes: DataSourceType[];
  dataSourceTypesDict: { [key: string]: DataSourceType };
  didListedDataSources: boolean;
  didListedConnectedDataSources: boolean;
  connectedDataSources: ConnectedDataSource[];
  isLoading: boolean;
  isNoResults: boolean;
  isModalOpen: boolean;
  isServerDown: boolean;
  isStartedFetching: boolean;
  isPreparingIndexing: boolean;
  isIndexing: boolean;
  discordCodeInput: string;
  docsLeftToIndex: number;
  docsInIndexing: number;
  docsIndexed: number;
  timeSinceLastIndexing: number;
  serverDownCount: number;
  showResultsPage: boolean;
  showResultModal: boolean; // CHANGED - ADDED !!
  showOrganisationsPage: boolean; // CHANGED - ADDED !!
  aciveResult: SearchResultDetails | null; // CHANGED - ADDED !!
  languageOpen: boolean;
  showNotReady: boolean;
  isFirstTimeIndexing: boolean;
  sourceInIndexing: string;
}

export interface ServerStatus {
  docs_in_indexing: number;
  docs_left_to_index: number;
  docs_indexed: number;
}

export interface UserDoc {
  name: string;
  email: string;
  recentDocs: SearchResultDetails[];
  organisations: string[];
  activeOrganisation: string;
}

Modal.setAppElement("#root");

const modalCustomStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background: "#221f2e",
    width: "52vw",
    border: "solid #694f94 0.5px",
    borderRadius: "12px",
    height: "fit-content",
    maxHeight: "86vh",
    padding: "0px",
  },
  overlay: {
    background: "#0000004a",
  },
  special: {
    stroke: "white",
  },
};

const languages = ["🇫🇷 FR", "🇩🇪 DE", "🇪🇸 ES", "🇮🇹 IT", "🇨🇳 CN", "🌏 GLOBAL"];

// ADDED - Firebase App
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleAuthProvier = new GoogleAuthProvider();

export default class App extends React.Component<{}, AppState> {
  constructor() {
    super({});
    this.state = {
      authed: "loading",
      user: null,
      userDoc: "loading",
      query: "",
      results: [], // CHANGED!!
      dataSourceTypes: [],
      didListedDataSources: false,
      dataSourceTypesDict: {},
      connectedDataSources: [],
      didListedConnectedDataSources: false,
      isLoading: false,
      isNoResults: false,
      isModalOpen: false,
      isServerDown: false,
      isStartedFetching: false,
      isPreparingIndexing: false,
      discordCodeInput: "",
      docsLeftToIndex: 0,
      docsInIndexing: 0,
      docsIndexed: 0,
      isIndexing: false,
      serverDownCount: 0,
      timeSinceLastIndexing: 0,
      searchDuration: 0,
      showResultsPage: false,
      showResultModal: false, // CHANGED - ADDED !!
      showOrganisationsPage: false, // CHANGED - ADDED !!
      aciveResult: null, // CHANGED - ADDED !!
      languageOpen: false,
      showNotReady: false,
      isFirstTimeIndexing: false,
      sourceInIndexing: "",
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleAddDoc = this.handleAddDoc.bind(this);
    this.handleLoginWithGoogle = this.handleLoginWithGoogle.bind(this);
    this.handleSignOut = this.handleSignOut.bind(this);
  }

  componentDidMount() {
    // ADDED - Firebase Auth
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.setState({ authed: true, user: user });
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log("Docsnap exists");
          const userDoc = docSnap.data() as UserDoc;
          console.log(userDoc);
          this.setState({ authed: true, user: user, userDoc: userDoc });
        } else {
          // docSnap.data() will be undefined in this case
          await setDoc(doc(db, "users", user.uid), {
            name: user.displayName,
            email: user.email,
            recentDocs: [],
            organisations: [],
            activeOrganisation: "",
          });
          this.setState({
            authed: true,
            user: user,
            userDoc: {
              name: user.displayName || "",
              email: user.email || "",
              recentDocs: [],
              organisations: [],
              activeOrganisation: "",
            },
          });
        }
      } else {
        this.setState({ authed: false, user: null, userDoc: null });
      }
    });

    if (localStorage.getItem("uuid") === null) {
      let uuid = uuidv4();
      localStorage.setItem("uuid", uuid);
    }
    posthog.identify(localStorage.getItem("uuid")!);

    // if (localStorage.getItem("discord_key") != null) {
    //   this.setState({ didPassDiscord: true });
    // }

    if (!this.state.isStartedFetching) {
      this.fetchStatsusForever();
      this.setState({ isStartedFetching: true });
      this.listConnectedDataSources();
      this.listDataSourceTypes();
    }

    let firstTimeIndexing = localStorage.getItem("first_time_indexing");
    if (firstTimeIndexing != null) {
      this.setState({
        isFirstTimeIndexing: true,
        sourceInIndexing: firstTimeIndexing,
        showNotReady: true,
      });
    } else {
      this.handleSearch();
    }
  }

  handleLoginWithGoogle() {
    signInWithPopup(auth, googleAuthProvier)
      .then(async (result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential) {
          const token = credential.accessToken;
          // The signed-in user info.
          const user = result.user;
          // IdP data available using getAdditionalUserInfo(result)
          // ...
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log("Docsnap exists");
            const userDoc = docSnap.data() as UserDoc;
            console.log(userDoc);
            this.setState({ authed: true, user: user, userDoc: userDoc });
          } else {
            // docSnap.data() will be undefined in this case
            await setDoc(doc(db, "users", user.uid), {
              name: user.displayName,
              email: user.email,
              recentDocs: [],
              organisations: [],
              activeOrganisation: "",
            });
            this.setState({
              authed: true,
              user: user,
              userDoc: {
                name: user.displayName || "",
                email: user.email || "",
                recentDocs: [],
              },
            });
          }
        }
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // // The email of the user's account used.
        // const email = error.customData.email;
        // // The AuthCredential type that was used.
        // const credential = GoogleAuthProvider.credentialFromError(error);
        console.log(error);
        console.log(errorCode);
        // ...
      });
  }

  handleSignOut() {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        this.setState({ authed: false, user: null });
        window.location.replace("/");
      })
      .catch((error) => {
        // An error happened.
      });
  }

  async fetchRecentDocs() {
    if (!this.state.user) {
      return;
    }
    const docRef = doc(db, "users", this.state.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userDoc = docSnap.data() as UserDoc;
      this.setState({ userDoc: userDoc });
    } else {
    }
  }

  async handleAddDoc(docToAdd: SearchResultDetails) {
    if (!this.state.user) {
      return;
    }
    const docRef = doc(db, "users", this.state.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userDoc = docSnap.data() as UserDoc;
      const recentDocs = userDoc.recentDocs;
      const found = recentDocs.find(
        (recentDoc) =>
          recentDoc.title === docToAdd.title &&
          recentDoc.type === docToAdd.type &&
          recentDoc.author === docToAdd.author &&
          recentDoc.data_source === docToAdd.data_source
      );
      if (!found) {
        recentDocs.unshift(docToAdd);
      } else {
        recentDocs.splice(recentDocs.indexOf(found), 1);
        recentDocs.unshift(found);
      }
      if (recentDocs.length > 5) {
        recentDocs.pop();
      }
      await updateDoc(doc(db, "users", this.state.user.uid), {
        recentDocs: recentDocs,
      });
      this.setState({ userDoc: { ...userDoc, recentDocs: recentDocs } });
    } else {
    }
  }

  handleSearch() {
    const path = window.location.pathname;
    const query = new URLSearchParams(window.location.search).get("query");
    if (path === "/search" && query !== null && query !== "") {
      this.setState({ query: query, showResultsPage: true });
      this.search(query);
    }
  }

  async listDataSourceTypes() {
    try {
      const response = await api.get<DataSourceType[]>("/data-sources/types");
      const filteredResponse = response.data.filter(
        (response) =>
          response.name === "google_drive" || response.name === "slack"
      );
      let dataSourceTypesDict: { [key: string]: DataSourceType } = {};
      filteredResponse.forEach((dataSourceType) => {
        dataSourceTypesDict[dataSourceType.name] = dataSourceType;
      });
      this.setState({
        dataSourceTypes: filteredResponse,
        dataSourceTypesDict: dataSourceTypesDict,
        didListedDataSources: true,
      });
    } catch (error) {}
  }

  async listConnectedDataSources() {
    try {
      const response = await api.get<ConnectedDataSource[]>(
        "/data-sources/connected"
      );
      this.setState({
        connectedDataSources: response.data,
        didListedConnectedDataSources: true,
      });
    } catch (error) {}
  }

  async fetchStatsusForever() {
    let timeBetweenFailToast = 5;
    let failSleepSeconds = 1;
    api
      .get<ServerStatus>("/status", { timeout: 3000 })
      .then((res) => {
        if (this.state.isServerDown) {
          toast.dismiss();
          if (!document.hidden) {
            toast.success("Server online.", { autoClose: 2000 });
          }
          this.listConnectedDataSources();
          this.listDataSourceTypes();
        }

        let isPreparingIndexing = this.state.isPreparingIndexing;
        let isIndexing = this.state.isIndexing;
        let lastIndexingTime = this.state.timeSinceLastIndexing;
        let isFirstTimeIndexing = this.state.isFirstTimeIndexing;
        if (
          res.data.docs_in_indexing > 0 ||
          res.data.docs_left_to_index > 0 ||
          (res.data.docs_indexed > this.state.docsIndexed &&
            this.state.docsIndexed > 0)
        ) {
          isIndexing = true;
          lastIndexingTime = Date.now();
          isPreparingIndexing = false;
        } else if (
          isIndexing &&
          Date.now() - lastIndexingTime > 1000 * 10 * 1
        ) {
          isIndexing = false;
          isFirstTimeIndexing = false;
          this.setState({ showNotReady: false });
          localStorage.removeItem("first_time_indexing");
          toast.success("Indexing finished.", { autoClose: 2000 });
        }

        this.setState({
          isServerDown: false,
          isFirstTimeIndexing: isFirstTimeIndexing,
          docsLeftToIndex: res.data.docs_left_to_index,
          docsInIndexing: res.data.docs_in_indexing,
          isPreparingIndexing: isPreparingIndexing,
          docsIndexed: res.data.docs_indexed,
          isIndexing: isIndexing,
          timeSinceLastIndexing: lastIndexingTime,
        });

        let timeToSleep = 1000;
        setTimeout(() => this.fetchStatsusForever(), timeToSleep);
      })
      .catch((err) => {
        console.log(err);
        this.setState({ serverDownCount: this.state.serverDownCount + 1 });

        if (this.state.serverDownCount > 5 && !document.hidden) {
          // if it's 6 seconds since last server down, show a toast
          toast.dismiss();
          toast.error(`Server is not responding (retrying...)`, {
            autoClose: (timeBetweenFailToast - 1) * 1000,
          });
          this.setState({ isServerDown: true, serverDownCount: 0 });
        }
        setTimeout(() => this.fetchStatsusForever(), failSleepSeconds * 1000);
      });
  }

  inIndexing() {
    return this.state.isPreparingIndexing || this.state.isIndexing;
  }

  getIndexingStatusText() {
    if (this.state.isPreparingIndexing) {
      return "Indexing process in progress...";
    }

    if (this.state.docsInIndexing > 0) {
      let text = "Indexing " + this.state.docsInIndexing + " documents...";
      if (this.state.docsLeftToIndex > 0) {
        text += " (" + this.state.docsLeftToIndex + " in queue";
        if (this.state.docsIndexed > 0) {
          text += ", " + this.state.docsIndexed + " indexed)";
        } else {
          text += ")";
        }
      } else {
        if (this.state.docsIndexed > 0) {
          text += " (" + this.state.docsIndexed + " indexed)";
        }
      }

      return text;
    }

    if (this.state.docsLeftToIndex > 0) {
      let text = `Fetching docs... (${this.state.docsLeftToIndex} docs in queue`;
      if (this.state.docsIndexed > 0) {
        text += ", " + this.state.docsIndexed + "  indexed)";
      } else {
        text += ")";
      }
      return text;
    }

    return `Indexing... (${this.state.docsIndexed} indexed)`;
  }

  openModal() {
    // if (this.state.didPassDiscord) {
    this.setState({ isModalOpen: true });
    // } else {
    // }
  }

  afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  closeModal() {
    this.setState({ isModalOpen: false });
  }

  getTitleGradient() {
    if (this.state.isServerDown) {
      return "from-[#333333_24.72%] via-[#333333_50.45%] to-[#333333_74.45%]";
    }

    return "from-[#FFFFFF_24.72%] via-[#B8ADFF_50.45%] to-[#B8ADFF_74.45%]";
  }

  getSocksColor() {
    if (this.state.isServerDown) {
      return " text-[#333333]";
    }

    return " text-[#A78BF6]";
  }

  dataSourcesAdded = (newlyConnected: ConnectedDataSource) => {
    posthog.capture("added", { name: newlyConnected.name });
    let isFirstTime = false;
    let sourceInIndexing = "";
    if (this.state.connectedDataSources.length === 0) {
      localStorage.setItem("first_time_indexing", newlyConnected.name);
      isFirstTime = true;
      sourceInIndexing = newlyConnected.name;
    }

    this.setState({
      isFirstTimeIndexing: isFirstTime,
      sourceInIndexing: sourceInIndexing,
      isPreparingIndexing: true,
      connectedDataSources: [
        ...this.state.connectedDataSources,
        newlyConnected,
      ],
    });
  };

  dataSourceRemoved = (removed: ConnectedDataSource) => {
    posthog.capture("removed", { name: removed.name });
    this.setState({
      connectedDataSources: this.state.connectedDataSources.filter(
        (ds) => ds.id !== removed.id
      ),
    });
  };

  // CHANGED - ADDED !!
  openResultModal = (result: SearchResultDetails) => {
    this.setState({ showResultModal: true, aciveResult: result });
  };
  // CHANGED - ADDED !!
  closeResultModal = () => {
    this.setState({ showResultModal: false, aciveResult: null });
  };

  // Changed - ADDED !!
  toggleShowOrganisations = (_event: React.MouseEvent) => {
    if (
      this.state.showOrganisationsPage &&
      this.state.userDoc?.activeOrganisation
    ) {
      this.setState({ showOrganisationsPage: false });
    }
    if (!this.state.showOrganisationsPage) {
      this.setState({ showOrganisationsPage: true });
    }
  };

  // CHANGED - ADDED !!
  bundleSearchResults = (results: SearchResultDetails[]) => {
    const newArray: SearchResultDetails[] = [];
    for (const result of results) {
      // Only bundle together if the data source is GDrive
      if (result.data_source === "google_drive") {
        const found = newArray.find((inspectedResult) => {
          if (
            inspectedResult.title === result.title &&
            inspectedResult.type === result.type &&
            inspectedResult.author === result.author &&
            inspectedResult.time === result.time &&
            inspectedResult.data_source === result.data_source
          ) {
            return true;
          } else {
            return false;
          }
        });

        if (found) {
          const index = newArray.indexOf(found);
          const newItem = {
            ...found,
            content: [...found.content, ...result.content],
            score: found.score > result.score ? found.score : result.score,
          };
          newArray.splice(index, 1, newItem);
        } else {
          newArray.push(result);
        }
      }
      // Otherwise, it is not from GDrive, so check if it is from Slack
      else if (result.data_source === "slack") {
        // If it is from Slack, separate the first text part and the second text part
        const newSlackResult: SearchResultDetails = {
          ...result,
          content: [result.content[0]],
        };
        newArray.push(newSlackResult);
      }
      // Otherwise it is not from GDrive or Slack, so we just push it to the result array
      else {
        newArray.push(result);
      }
    }
    return newArray;
  };

  render() {
    return (
      <div>
        <ToastContainer className="z-50" theme="colored" />
        {/* Changed!! Added Nav */}
        <div className="fixed h-screen w-[100px] bg-[#e5e5e5] flex flex-col items-center px-[20px] py-[40px] gap-[40px] z-10">
          <button onClick={this.goHomePage} className="cursor-pointer">
            <img
              src={PreceptLogo}
              alt="Precept Logo"
              className="w-[48px] h-auto cursor-pointer"
            />
          </button>
          <button onClick={this.goHomePage} className="cursor-pointer">
            <SearchIcon />
          </button>
          <button onClick={this.openModal} className="cursor-pointer">
            <DataIcon />
          </button>
          <button
            onClick={this.toggleShowOrganisations}
            className="cursor-pointer"
          >
            <DataIcon />
          </button>
          {this.state.authed === true ? (
            <button onClick={this.handleSignOut} className="cursor-pointer">
              <LogoutIcon />
            </button>
          ) : (
            <button onClick={() => {}} className="cursor-pointer">
              <ProfileIcon />
            </button>
          )}
        </div>

        <Tooltip id="my-tooltip" style={{ fontSize: "18px" }} />
        {this.inIndexing() && (
          <div className="absolute mx-auto left-0 right-0 w-fit z-20 top-6">
            <div className="text-xs bg-[#0D7E97] border-[#4F4F4F] border-[.8px] rounded-full inline-block px-3 py-1">
              <div className="text-[#E4E4E4] font-medium font-dm-sans text-sm flex flex-row justify-center items-center">
                <ClipLoader
                  color="#ffffff"
                  loading={true}
                  size={14}
                  aria-label="Loading Spinner"
                />
                <span className="ml-2">{this.getIndexingStatusText()}</span>
              </div>
            </div>
          </div>
        )}
        {
          /* Go add some data sources ->*/
          this.state.didListedConnectedDataSources &&
            this.state.connectedDataSources.length === 0 && (
              // this.state.didPassDiscord &&
              <div className="absolute mx-auto left-0 right-0 w-fit z-20 top-6">
                <div className="text-xs bg-[#0D7E97] border-[#a61616] border-[.8px] rounded-full inline-block px-3 py-1">
                  <div className="text-[#fff] font-medium font-dm-sans text-sm flex flex-row justify-center items-center">
                    <AiFillWarning color="white" size={20} />
                    <span className="ml-2">No sources added. </span>
                    <button
                      className="font-medium ml-1 text-[white] animate-pulse hover:cursor-pointer inline-flex items-center transition duration-150 ease-in-out group"
                      onClick={this.openModal}
                    >
                      Go add some{" "}
                      <span className="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">
                        -&gt;
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )
        }
        {/* Not ready yet page */}
        {this.state.showNotReady && (
          <div className="absolute z-30 flex flex-col items-center top-[200px] mx-auto w-full">
            <div className="flex flex-col items-center w-[660px] h-[280px] bg-[#fff] border-[1px] border-[#3f3066] rounded-xl">
              <div className="flex flex-col justify-center items-center py-2">
                <div className="ml-[614px] text-2xl text-[#4d3e88] gap-4">
                  <IoMdClose
                    onClick={() => this.setState({ showNotReady: false })}
                    className="hover:text-[#0D7E97] hover:cursor-pointer"
                  />
                </div>
                <span className="flex flex-row text-white text-3xl font-bold m-5 mt-5 mb-1 font-sans items-center">
                  <span className="text-[#0D7E97] text-3xl">
                    Not ready yet!
                  </span>
                </span>
                <span className="text-[#000] text-lg">
                  Precept won't be usefull until we finish indexing your
                  workplace.
                </span>
                <span className="text-[#000] text-xl mt-10 font-semibold">
                  {this.capitilize(this.state.sourceInIndexing)}
                  <span className="font-medium">
                    {" "}
                    ({this.state.docsIndexed}/
                    {this.state.docsIndexed +
                      this.state.docsInIndexing +
                      this.state.docsLeftToIndex +
                      1}
                    )
                  </span>
                  ...
                </span>
                <ProgressBar
                  completed={parseInt(
                    (
                      (this.state.docsIndexed /
                        (this.state.docsIndexed +
                          this.state.docsInIndexing +
                          this.state.docsLeftToIndex +
                          1)) *
                      100
                    ).toFixed(2)
                  )}
                  bgColor={"#0D7E97"}
                  baseBgColor={"rgba(0,0,0,0.06)"}
                  className="w-[450px] mt-5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Login or loading or app */}
        {this.state.authed === "loading" || this.state.userDoc === "loading" ? (
          <div className="w-screen z-10 filter min-h-screen bg-white flex flex-col items-center py-[80px] px-[100px] gap-[80px]">
            <div className=" flex flex-col items-center justify-center gap-[10px]">
              <div className="w-20 h-20 rounded-full animate-pulse bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(0,0,0,0.8)]"></div>
              <div className="w-[150px] h-[55px] rounded-md animate-pulse bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(0,0,0,0.8)]"></div>
            </div>
            <div className="w-[200px] h-[65px] rounded-md animate-pulse bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(0,0,0,0.8)]"></div>
            <div className="w-[250px] h-[55px] rounded-[10px] animate-pulse bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(0,0,0,0.8)]"></div>
          </div>
        ) : this.state.authed === false ? (
          <div className="w-screen z-10 filter min-h-screen bg-white flex flex-col items-center py-[80px] px-[100px] gap-[80px]">
            <div className=" flex flex-col items-center justify-center gap-[10px]">
              <img
                alt="Precept Logo"
                src={PreceptLogo}
                className="w-[128px] h-[128px]"
              />
              <h1
                className={
                  " text-[#000] block font-dm-sans text-3xl text-center"
                }
              >
                Precept
              </h1>
            </div>
            <h2 className="font-dm-sans font-bold text-5xl">Login</h2>
            <div className="flex gap-[40px]">
              <button onClick={() => {}} className="cursor-pointer">
                <img
                  className="h-[55px] w-auto"
                  src={MicrosoftLoginButton}
                  alt="Login with Microsoft"
                />
              </button>
              <button
                onClick={this.handleLoginWithGoogle}
                className="cursor-pointer"
              >
                <img
                  className="h-[55px] w-auto shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                  src={GoogleLoginButton}
                  alt="Login with Google"
                />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={
              "w-screen z-10 filter min-h-screen " +
              (this.state.isModalOpen ||
              (this.state.didListedConnectedDataSources &&
                this.state.connectedDataSources.length === 0)
                ? "filter blur-sm"
                : "") +
              (this.state.showResultsPage ? "bg-white" : "")
            }
          >
            <Modal
              isOpen={this.state.isModalOpen}
              onRequestClose={this.closeModal}
              contentLabel="Example Modal"
              style={modalCustomStyles}
            >
              <DataSourcePanel
                onClose={this.closeModal}
                connectedDataSources={this.state.connectedDataSources}
                inIndexing={this.inIndexing()}
                onAdded={this.dataSourcesAdded}
                dataSourceTypesDict={this.state.dataSourceTypesDict}
                onRemoved={this.dataSourceRemoved}
              />
            </Modal>

            {/* check if there is an active organisation */}
            {!this.state.userDoc?.activeOrganisation ||
            this.state.showOrganisationsPage ? (
              <div className="relative flex flex-col items-center top-10 mx-auto w-full">
                <h1 className="flex flex-col items-center gap-[10px] text-3xl text-center text-white m-10">
                  <img
                    alt="Precept Logo"
                    src={PreceptLogo}
                    className="w-[128px] h-[128px]"
                  />
                  <span
                    className={
                      " text-[#000] block font-dm-sans md:leading-normal bg-clip-text bg-gradient-to-l"
                    }
                  >
                    Precept
                  </span>
                </h1>

                <AddOrganisation />
              </div>
            ) : !this.state.showResultsPage ? (
              // front search page*
              <div className="relative flex flex-col items-center top-10 mx-auto w-full">
                <h1 className="flex flex-col items-center gap-[10px] text-3xl text-center text-white m-10">
                  <img
                    alt="Precept Logo"
                    src={PreceptLogo}
                    className="w-[128px] h-[128px]"
                  />
                  <span
                    className={
                      " text-[#000] block font-dm-sans md:leading-normal bg-clip-text bg-gradient-to-l"
                    }
                  >
                    Precept
                  </span>
                </h1>
                <SearchBar
                  widthPercentage={32}
                  isDisabled={this.state.isServerDown}
                  query={this.state.query}
                  isLoading={this.state.isLoading}
                  showReset={this.state.results.length > 0}
                  onSearch={this.goSearchPage}
                  onQueryChange={this.handleQueryChange}
                  onClear={this.clear}
                  showSuggestions={true}
                />

                <button
                  onClick={this.goSearchPage}
                  className="h-9 w-28 mt-8 p-3 flex items-center justify-center hover:shadow-sm
                  transition duration-150 ease-in-out hover:shadow-[#6c6c6c] bg-[#0D7E97] rounded border-[.5px] border-[#6e6e6e88]"
                >
                  <span className="font-bold text-[15px] text-[#fff]">
                    Search
                  </span>
                  <img alt="enter" className="ml-2" src={EnterImage}></img>
                </button>

                <div className="w-[80%] flex flex-col gap-[20px] px-[120px] py-[40px]">
                  <h2>Recent docs</h2>
                  {this.state.userDoc?.recentDocs.map((result, index) =>
                    this.state.dataSourceTypesDict[result.data_source] ? (
                      <SearchResult
                        key={index}
                        resultDetails={{
                          ...result,
                          score: 80,
                          content:
                            result.data_source === "slack"
                              ? [result.content[0]]
                              : [],
                        }}
                        dataSourceType={
                          this.state.dataSourceTypesDict[result.data_source]
                        }
                        openModal={this.openResultModal}
                        closeModal={this.closeResultModal}
                        addRecentDoc={this.handleAddDoc}
                        db={db}
                      />
                    ) : (
                      <SkeletonLoader />
                    )
                  )}
                </div>
                {this.state.showResultModal && this.state.aciveResult && (
                  <ResultModal
                    result={this.state.aciveResult}
                    dataSourceType={
                      this.state.dataSourceTypesDict[
                        this.state.aciveResult.data_source
                      ]
                    }
                    closeModal={this.closeResultModal}
                    addRecentDoc={this.handleAddDoc}
                    db={db}
                  />
                )}
              </div>
            ) : (
              // Search results page
              // <div className="relative flex flex-row w-full bg-white min-h-full">
              <div className="flex flex-col items-center w-full h-full pl-[100px]">
                <div className="w-full flex justify-center items-center py-[20px] bg-[rgba(0,0,0,0.04)] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                  <SearchBar
                    widthPercentage={40}
                    isDisabled={this.state.isServerDown}
                    query={this.state.query}
                    isLoading={this.state.isLoading}
                    showReset={this.state.results.length > 0}
                    onSearch={this.goSearchPage}
                    onQueryChange={this.handleQueryChange}
                    onClear={this.clear}
                    showSuggestions={true}
                  />
                </div>
                {this.state.isLoading && (
                  <div className="w-full flex flex-col gap-[20px] px-[20px] py-[80px]">
                    <SkeletonLoader />
                    <SkeletonLoader />
                  </div>
                )}
                {!this.state.isLoading && (
                  <span className="text-[#D2D2D2] font-dm-sans font-medium text-base leading-[22px] mt-3">
                    {this.bundleSearchResults(this.state.results).length}{" "}
                    {this.bundleSearchResults(this.state.results).length > 1
                      ? "Results"
                      : "Result"}{" "}
                    ({this.state.searchDuration} seconds)
                  </span>
                )}
                {this.state.dataSourceTypes.length > 0 && (
                  <div className="w-full flex flex-col gap-[20px] px-[20px] py-[40px]">
                    {this.bundleSearchResults(this.state.results).map(
                      (result, index) => {
                        return (
                          <SearchResult
                            key={index}
                            resultDetails={result}
                            dataSourceType={
                              this.state.dataSourceTypesDict[result.data_source]
                            }
                            openModal={this.openResultModal}
                            closeModal={this.closeResultModal}
                            addRecentDoc={this.handleAddDoc}
                            db={db}
                          />
                        );
                      }
                    )}
                  </div>
                )}
                {this.state.showResultModal && this.state.aciveResult && (
                  <ResultModal
                    result={this.state.aciveResult}
                    dataSourceType={
                      this.state.dataSourceTypesDict[
                        this.state.aciveResult.data_source
                      ]
                    }
                    closeModal={this.closeResultModal}
                    addRecentDoc={this.handleAddDoc}
                    db={db}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  capitilize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  handleQueryChange = (query: string) => {
    this.setState({ query: query });
  };

  clear = () => {
    this.setState({ query: "" });
  };

  showNotReady = () => {
    this.setState({ showNotReady: true });
  };

  goSearchPage = () => {
    if (this.state.isFirstTimeIndexing) {
      this.showNotReady();
      posthog.capture("blocked_premature_search");
      return;
    }
    window.location.replace(`/search?query=${this.state.query}`);
  };

  goHomePage = () => {
    this.setState({ query: "" });
    window.location.replace(`/`);
  };

  search = (query?: string) => {
    if (this.state.isFirstTimeIndexing) {
      this.showNotReady();
      posthog.capture("blocked_premature_search");
      return;
    }

    if (!query && this.state.query === "") {
      console.log("empty query");
      return;
    }

    let searchQuery = query ? query : this.state.query;

    this.setState({ isLoading: true });
    let start = new Date().getTime();

    posthog.capture("search");

    try {
      api
        .get<SearchResultDetails[]>("/search", {
          params: {
            query: searchQuery,
          },
          headers: {
            uuid: localStorage.getItem("uuid"),
          },
        })
        .then((response) => {
          let end = new Date().getTime();
          let duartionSeconds = (end - start) / 1000;
          console.log(response.data);
          this.setState({
            results: response.data,
            isLoading: false,
            searchDuration: duartionSeconds,
            showResultsPage: response.data.length > 0,
          });
          addToSearchHistory(searchQuery);

          if (response.data.length === 0) {
            toast.warn("No results found");
          }
        });
    } catch (error) {
      toast.error("Error searching: " + error.response.data, {
        autoClose: 10000,
      });
    }
  };
}
