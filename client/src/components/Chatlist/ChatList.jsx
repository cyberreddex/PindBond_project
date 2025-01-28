import React, { useEffect, useState } from "react";
import ChatListHeader from "./ChatListHeader";
import SearchBar from "./SearchBar";
import List from "./List";
import ContactsList from "./ContactsList";
import { useStateProvider } from "@/context/StateContext";

function ChatList() {
  const [{ contactsPage }] = useStateProvider();
  const [pageType, setPageType] = useState(contactsPage ? "all-contacts" : "default");

  useEffect(() => {
    setPageType(contactsPage ? "all-contacts" : "default");
  }, [contactsPage]);

  return (
    <div className="bg-panel-header-background flex flex-col max-h-screen z-20">
      {pageType === "default" ? (
        <>
          <ChatListHeader />
          <SearchBar />
          <List />
        </>
      ) : (
        <ContactsList />
      )}
    </div>
  );
}

export default ChatList;
