// components/TextEditorClient.tsx
'use client';

import { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function TextEditorClient() {
  const editorRef = useRef<any>(null);

  // Fake states for UI placeholders
  const [showChats, setShowChats] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [aiUsage, setAiUsage] = useState<'full' | 'partial' | 'none'>('full');

  const fakeChats = [
    { id: 1, title: 'Math help', preview: 'Solved problem about fractions' },
    { id: 2, title: 'Lesson plan', preview: 'Draft for next week' },
    { id: 3, title: 'Parent note', preview: 'Reminder and updates' }
  ];

  const fakeProjects = [
    { id: 'p1', name: 'Biology Unit' },
    { id: 'p2', name: 'Term 2 Assessments' }
  ];

  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  const openChat = (id: number) => {
    setSelectedChat(id);
    console.log('Open chat', id);
    setShowChats(false);
  };

  const trafficColor = aiUsage === 'full' ? '#16a34a' : aiUsage === 'partial' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1, padding: 16 }}>
        <Editor
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          licenseKey="gpl"
          onInit={(_evt, editor) => (editorRef.current = editor)}
          initialValue="<p>This is the initial content of the editor.</p>"
          init={{
            branding: false,
            height: 540,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
            ],
            toolbar:
              'undo redo | blocks | bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | removeformat | help',
            content_style:
              'body { font-family: Inter, Helvetica, Arial, sans-serif; font-size: 14px; padding: 12px }'
          }}
        />
      </div>

      {/* Bottom panel */}
      <div style={{ position: 'sticky', bottom: 0, background: '#0f172a', color: '#e6eef8', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Star / Chats button */}
        <button aria-label="Open chats" onClick={() => setShowChats(true)} style={{ background: 'transparent', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.3l6.18 3.73-1.64-7.03L21.5 9.5l-7.19-.62L12 2 9.69 8.88 2.5 9.5l4.96 4.5L5.82 21z" />
          </svg>
          <span style={{ opacity: 0.9 }}>Chats</span>
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* AI Usage status (wide) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }} onClick={() => setAiUsage(aiUsage === 'full' ? 'partial' : aiUsage === 'partial' ? 'none' : 'full')}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: trafficColor }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>AI Usage</div>
          <div style={{ color: 'rgba(230,238,248,0.7)', fontSize: 13 }}>{aiUsage === 'full' ? 'Full' : aiUsage === 'partial' ? 'Partial' : 'None'}</div>
        </div>

        {/* Attach project button */}
        <button aria-label="Attach project" onClick={() => setShowProjectModal(true)} style={{ marginLeft: 12, background: '#0b1220', border: '1px solid rgba(255,255,255,0.04)', color: 'inherit', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
          Attach
        </button>

        {/* Log button for editor content (small utility) */}
        <button onClick={log} style={{ marginLeft: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: 'inherit', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Log</button>
      </div>

      {/* Side panel for chats */}
      {showChats && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, background: '#071029', color: '#e6eef8', boxShadow: '-8px 0 20px rgba(2,6,23,0.6)', padding: 16, display: 'flex', flexDirection: 'column', zIndex: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Chats</div>
            <button aria-label="Close chats" onClick={() => setShowChats(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {fakeChats.map((c) => (
              <div key={c.id} onClick={() => openChat(c.id)} style={{ padding: 10, borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: selectedChat === c.id ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(230,238,248,0.7)' }}>{c.preview}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <input placeholder="Prompt..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: '#021024', color: 'inherit' }} />
          </div>
        </div>
      )}

      {/* Project modal */}
      {showProjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}>
          <div style={{ width: 480, background: '#071029', color: '#e6eef8', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Attach to Project</div>
              <button onClick={() => setShowProjectModal(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {fakeProjects.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(230,238,248,0.7)' }}>ID: {p.id}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { console.log('Attach to', p.id); setShowProjectModal(false); }} style={{ background: '#0ea5a0', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Attach</button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <a href="/projects/create" style={{ textDecoration: 'none' }}>
                  <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: 'inherit' }}>Create New Project</button>
                </a>
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowProjectModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(230,238,248,0.8)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
