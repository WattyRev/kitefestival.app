'use client'

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import TextInput from "@/components/ui/TextInput";
import { kv } from "@vercel/kv";
import { useState } from "react";

interface PasscodesPayload {
  adminPasscode?: string,
  editorPasscode?: string,
  userPasscode?: string,
  authentication: string,
}

const usePasscode = () => {
  const [enabled, setEnabled] = useState(false);
  const [passcode, setPasscodeValue] = useState('');

  return {
    enabled,
    passcode,
    toggle: () => setEnabled(!enabled),
    setPasscode: (value: string) => { 
      setPasscodeValue(value);
      if (value) {
        setEnabled(true);
      } else {
        setEnabled(false);
      }
    }
  }
}

export default function ConfigPage() {
  const { 
     enabled: useAdminPasscode,
     passcode: adminPasscode,
     toggle: toggleAdminPasscode,
     setPasscode: setAdminPasscode
  } = usePasscode();
  const { 
    enabled: useEditorPasscode,
    passcode: editorPasscode,
    toggle: toggleEditorPasscode,
    setPasscode: setEditorPasscode
  } = usePasscode();
  const { 
    enabled: useUserPasscode,
    passcode: userPasscode,
    toggle: toggleUserPasscode,
    setPasscode: setUserPasscode
  } = usePasscode();

  const submitPasscodes = async function() {
    console.log('submitPasscodes');
    if (!useAdminPasscode && !useEditorPasscode && !useUserPasscode) {
      return;
    }
    const authentication: string = prompt("Enter the current admin passcode.") || '';
    const payload: PasscodesPayload = { authentication };
    if (useAdminPasscode) {
      payload.adminPasscode = adminPasscode;
    }
    if (useEditorPasscode) {
      payload.editorPasscode = editorPasscode;
    }
    if (useUserPasscode) {
      payload.userPasscode = userPasscode;
    }
    const response = await fetch('/api/passcodes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const { message } = await response.json();
    alert(message);
  }

  return (
    <form onSubmit={e => { e.preventDefault(); submitPasscodes()}}>
      <h1>Config</h1>
      <Panel>
        <h2>Set Passcodes</h2>
        <Panel>
          <label htmlFor="admin-passcode">Admin</label>&nbsp;
          <input type="checkbox" checked={useAdminPasscode} onChange={toggleAdminPasscode} />
          <TextInput id="admin-passcode" value={adminPasscode} onChange={e => setAdminPasscode(e.target.value)} />
        </Panel>
        <Panel>
          <label htmlFor="editor-passcode">Editor</label>&nbsp;
          <input type="checkbox" checked={useEditorPasscode} onChange={toggleEditorPasscode} />
          <TextInput id="editor-passcode" value={editorPasscode} onChange={e => setEditorPasscode(e.target.value)} />
        </Panel>
        <Panel>
          <label htmlFor="user-passcode">User</label>&nbsp;
          <input type="checkbox" checked={useUserPasscode} onChange={toggleUserPasscode} />
          <TextInput id="user-passcode" value={userPasscode} onChange={e => setUserPasscode(e.target.value)} />
        </Panel>
      </Panel>
      <Button type="submit">Submit</Button>
    </form>
  );
}
