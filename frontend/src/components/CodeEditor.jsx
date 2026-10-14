import React, { useState, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';
import { BiCopy } from 'react-icons/bi';
import { FaSun, FaMoon } from 'react-icons/fa';
import { FiPlus, FiMinus } from 'react-icons/fi';

const CodeEditor = () => {
    const [code, setCode] = useState('// Write your code here...');
    const [language, setLanguage] = useState('cpp');
    const [theme, setTheme] = useState('dark');
    const [fontSize, setFontSize] = useState(14);
    const [output, setOutput] = useState('');
    const [customInput, setCustomInput] = useState('');
    const [runtimes, setRuntimes] = useState([]);
    const [running, setRunning] = useState(false);
    const [runtimeError, setRuntimeError] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';
    useEffect(() => {
        let active = true;
        axios.get(`${apiUrl}/api/code/runtimes`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
            .then(response => { if (active) setRuntimes(response.data); })
            .catch(error => { if (active) setRuntimeError(error.response?.data?.message || error.message); });
        return () => { active = false; };
    }, []);
    const editorRef = useRef();
    const containerRef = useRef();
    const [editorHeight, setEditorHeight] = useState(70);

    const handleEditorChange = (value) => {
        setCode(value);
    };

    const handleInput = (e) => {
        setCustomInput(e.target.value);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    };

    const handleCopyInput = () => {
        navigator.clipboard.writeText(customInput);
        alert('Input copied to clipboard');
    };

    const handleCopyOutput = () => {
        navigator.clipboard.writeText(output);
        alert('Output copied to clipboard');
    };

    const handleThemeToggle = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handleFontSizeChange = (increment) => {
        setFontSize(fontSize + increment);
    };

    const handleRunCode = async () => {
        if (running) return;
        const aliases = language === 'cpp' ? ['cpp', 'c++'] : [language];
        const runtime = runtimes.find(item => [item.language, ...(item.aliases || [])].some(name => aliases.includes(name)));
        if (!runtime) { setOutput(runtimeError || 'Selected language is not installed on the execution server'); return; }
        setRunning(true);
        try {
            const response = await axios.post(`${apiUrl}/api/code/execute`, {
                language: runtime.language, version: runtime.version, code, stdin: customInput,
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setOutput([response.data.compile?.output, response.data.run?.output].filter(Boolean).join('\n') || 'Program completed without output');
        } catch (error) {
            setOutput(error.response?.data?.message || error.message);
        } finally { setRunning(false); }
    };

    const handleMouseDown = (e) => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const containerHeight = containerRef.current.offsetHeight;
        const newEditorHeight = Math.max(20, Math.min(80, ((e.clientY - containerRef.current.getBoundingClientRect().top) / containerHeight) * 100));
        setEditorHeight(newEditorHeight);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div ref={containerRef} className={`editor-page w-full min-h-screen p-4 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="editor-toolbar flex justify-between mb-4">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="p-2 bg-white border rounded"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                </select>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleFontSizeChange(1)} className="p-2 bg-gray-200 rounded">
                        <FiPlus />
                    </button>
                    <button onClick={() => handleFontSizeChange(-1)} className="p-2 bg-gray-200 rounded">
                        <FiMinus />
                    </button>
                    <button onClick={handleThemeToggle} className="p-2 bg-gray-200 rounded">
                        {theme === 'light' ? <FaMoon /> : <FaSun />}
                    </button>
                    <button onClick={handleCopyCode} className="p-2 bg-gray-200 rounded">
                        <BiCopy />
                    </button>
                    <button disabled={running || !runtimes.length} onClick={handleRunCode} className="p-2 bg-gray-200 rounded">
                        {running ? 'Running…' : 'Run Code'}
                    </button>
                </div>
            </div>
            {runtimeError && <p role="alert">{runtimeError}</p>}
            <div className="flex-grow" style={{ height: `${editorHeight}%` }}>
                <MonacoEditor
                    height="100%"
                    language={language === 'csharp' ? 'csharp' : language}
                    theme={theme === 'light' ? 'light' : 'vs-dark'}
                    value={code}
                    onChange={handleEditorChange}
                    options={{
                        fontSize: fontSize,
                        automaticLayout: true,
                    }}
                    onMount={(editor) => {
                        editorRef.current = editor;
                    }}
                />
            </div>
            <div
                onMouseDown={handleMouseDown}
                className="h-2 bg-gray-400 cursor-row-resize"
            ></div>
            <div className="flex-grow flex mt-4 space-x-4" style={{ height: `${100 - editorHeight - 2}%` }}>
                <div className={`editor-pane w-1/2 p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded resize-y overflow-auto`}>
                    <h2 className="text-lg font-bold">Custom Input:</h2>
                    <button onClick={handleCopyInput} className="p-2 bg-gray-400 rounded">
                        <BiCopy />
                    </button>
                    <textarea
                        value={customInput}
                        onChange={handleInput}
                        className={`w-full p-2 rounded ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                        rows="4"
                    />
                </div>
                <div className={`editor-pane w-1/2 p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded resize-y overflow-auto`}>
                    <h2 className="text-lg font-bold">Output:</h2>
                    <button onClick={handleCopyOutput} className="p-2 bg-gray-400 rounded">
                        <BiCopy />
                    </button>
                    <pre>{output}</pre>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
