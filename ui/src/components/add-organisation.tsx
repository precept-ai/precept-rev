import React, { useState } from "react";

export default function AddOrganisation() {
  const [org, setOrg] = useState("");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(org);
    setOrg("");
  };
  return (
    <div className="flex flex-col gap-[40px] items-center p-[40px] bg-white rounded-[10px]">
      <h2 className="text-xl font-bold">Add an existing organisation</h2>
      <form
        className="flex flex-col items-center gap-[20px]"
        onSubmit={handleSubmit}
      >
        <label htmlFor="org">Enter your organisation ID</label>
        <input
          type="text"
          id="org"
          name="org"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="outline-none border-2 w-full min-w-[320px] h-[45px] rounded-[10px] py-[5px]"
        />
        <button
          type="submit"
          className="bg-[#0D7E97] text-white w-[250px] h-[45px] rounded-[10px]"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
