import os
import time
import json
import requests
import streamlit as st

BASE_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
st.set_page_config(page_title="StudyLM", layout="wide")

st.title("StudyLM — Streamlit UI (MVP)")
st.caption(f"Backend: {BASE_URL}")

with st.sidebar:
    st.header("Upload PDF")
    up = st.file_uploader("Choose a PDF", type=["pdf"])
    if up is not None and st.button("Upload", use_container_width=True):
        files = {"file": (up.name, up.getvalue(), "application/pdf")}
        r = requests.post(f"{BASE_URL}/upload", files=files, timeout=120)
        if r.ok:
            data = r.json()
            st.session_state["file_id"] = data["file_id"]
            st.success(f"Queued: {data['file_id']}")
        else:
            st.error(r.text)

    st.divider()
    st.header("Documents")
    try:
        r = requests.get(f"{BASE_URL}/uploads-list", timeout=30)
        files = r.json().get("files", []) if r.ok else []
    except Exception:
        files = []
    sel = st.selectbox("Known PDFs", options=[f for f in files], index=None, placeholder="Select...")
    if sel:
        st.session_state["file_id"] = sel.replace(".pdf", "")
    file_id = st.text_input("file_id", value=st.session_state.get("file_id", ""))
    st.session_state["file_id"] = file_id
    if file_id:
        s = requests.get(f"{BASE_URL}/status/{file_id}").json()
        if s.get("ready"):
            st.success("Ready")
        else:
            st.info("Processing…")
        if s.get("error"):
            st.error(s["error"])
        st.markdown(f"[Open PDF]({BASE_URL}/uploads/{file_id}.pdf)")

left, right = st.columns([1,2])

with left:
    st.subheader("Notes")
    if st.session_state.get("file_id"):
        fid = st.session_state["file_id"]
        try:
            notes = requests.get(f"{BASE_URL}/notes/{fid}").json().get("notes", [])
        except Exception:
            notes = []
        for n in notes:
            st.write("- ", n)
        new_note = st.text_area("Add a note")
        if st.button("Save note") and new_note.strip():
            r = requests.post(f"{BASE_URL}/save_note", json={"file_id": fid, "note": new_note.strip()})
            if r.ok:
                st.success("Saved")
                st.experimental_rerun()
            else:
                st.error(r.text)
    else:
        st.info("Select or upload a document to manage notes.")

with right:
    st.subheader("Ask a question")
    question = st.text_input("Your question", placeholder="What is this document about?")
    if st.button("Ask"):
        fid = st.session_state.get("file_id")
        if not fid:
            st.warning("Select or upload a document first.")
        else:
            # Basic polling to ensure ready
            ready = False
            for _ in range(12):
                s = requests.get(f"{BASE_URL}/status/{fid}").json()
                if s.get("ready"):
                    ready = True
                    break
                time.sleep(1)
            if not ready:
                st.warning("Document not ready yet. Try again in a bit.")
            else:
                with st.spinner("Thinking…"):
                    r = requests.post(f"{BASE_URL}/ask", json={"file_id": fid, "question": question}, timeout=120)
                if r.ok:
                    data = r.json()
                    st.markdown(data.get("answer", "(no answer)"))
                    cits = data.get("citations", [])
                    if cits:
                        st.caption("Sources")
                        for i, c in enumerate(cits, 1):
                            pg_start = c.get("page_start")
                            pg_end = c.get("page_end")
                            pg = f"{pg_start}" if (pg_end == pg_start or not pg_end) else f"{pg_start}-{pg_end}"
                            url = c.get("url")
                            preview = c.get("preview", "")
                            st.write(f"[{i}] ")
                            if url:
                                st.markdown(f"- p. {pg}: [{preview}]({BASE_URL}{url})")
                            else:
                                st.markdown(f"- p. {pg}: {preview}")
                else:
                    st.error(r.text)
