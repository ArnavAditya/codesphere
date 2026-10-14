import useDialog from '../hooks/useDialog';

import React, { useState } from 'react';
import { FiImage, FiSmile, FiX, FiPlus, FiSend } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const CreatePostForm = ({ onCreated }) => {
    const user = useSelector((state) => state.auth.user);
    const token = localStorage.getItem('token');

    const [isOpen, setIsOpen] = useState(false);
    const [inputs, setInputs] = useState({ desc: "" });
    const [previews, setPreviews] = useState([]);
    const [picPath, setPicPath] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

    const [isPosting, setIsPosting] = useState(false);
    React.useEffect(() => () => previews.forEach(preview => URL.revokeObjectURL(preview)), [previews]);
    const openModal = () => setIsOpen(true);
    const closeModal = () => { if (!isUploading && !isPosting) setIsOpen(false); };
    useDialog(isOpen, closeModal);
    const change = e => setInputs(previous => ({ ...previous, [e.target.name]: e.target.value }));
    const addEmoji = emoji => { setInputs(previous => ({ ...previous, desc: previous.desc + emoji.native })); setShowEmojiPicker(false); };
    const handlePost = async () => {
        if (isUploading || isPosting || !user) return;
        setIsPosting(true);
        setUploadError(null);
        try {
            await axios.post(`${apiUrl}/api/post/create`, { description: inputs.desc, picturePath: picPath }, { headers: { Authorization: `Bearer ${token}` } });
            setInputs({ desc: '' }); setPreviews([]); setPicPath(''); setIsOpen(false); onCreated?.();
        } catch (error) { setUploadError(error.response?.data?.message || 'Could not share your post. Please try again.'); }
        finally { setIsPosting(false); }
    };
    const handleImageUpload = async event => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploading(true); setUploadError(null); setPicPath('');
        setPreviews([URL.createObjectURL(file)]);
        const formData = new FormData(); formData.append('image', file);
        try {
            const response = await axios.post(`${apiUrl}/upload-images`, formData, { headers: { Authorization: `Bearer ${token}` } });
            const url = response.data?.data?.[0]?.url;
            if (!url) throw new Error('The image could not be uploaded');
            setPicPath(url);
        } catch (error) { setUploadError(error.response?.data?.message || error.message); setPreviews([]); }
        finally { setIsUploading(false); event.target.value = ''; }
    };
    return <>
        <button onClick={openModal} className="surface feed-composer"><span className="initial-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span>What are you working on, {user?.firstName || 'developer'}?</span><span className="composer-plus"><FiPlus /></span></button>
        {isOpen && <div className="modal-backdrop" onClick={closeModal}><section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="new-post-heading" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') closeModal(); }}><div className="modal-heading"><div><p className="eyebrow">SHARE A LITTLE PROGRESS</p><h2 id="new-post-heading">Create a post</h2></div><button className="icon-button" onClick={closeModal} aria-label="Close post form"><FiX /></button></div><div className="post-header"><span className="initial-avatar">{user?.firstName?.[0]}</span><div><strong>{user?.firstName} {user?.lastName}</strong><p className="muted">Sharing with your circle</p></div></div><textarea className="post-textarea" aria-label="Post text" placeholder="A small win, a big idea, a question…" value={inputs.desc} onChange={change} name="desc" maxLength={300} /><div className="image-previews">{previews.map((preview, index) => <img key={index} src={preview} alt="Selected image preview" />)}</div><div className="composer-toolbar"><div><button className="icon-button" aria-label="Attach an image" onClick={() => document.getElementById('post-image-input').click()} disabled={isUploading}><FiImage /></button><button className="icon-button" aria-label="Choose emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FiSmile /></button></div><span className="muted">{inputs.desc.length}/300</span></div><input id="post-image-input" type="file" accept="image/jpeg,image/png" hidden onChange={handleImageUpload} disabled={isUploading} />{showEmojiPicker && <div className="emoji-picker"><Picker data={data} onEmojiSelect={addEmoji} /></div>}{uploadError && <p className="error-notice" role="alert">{uploadError}</p>}<div className="modal-footer"><span className="muted">{isUploading ? 'Uploading your image…' : 'Make someone’s day. Share something.'}</span><button className="button button-primary" onClick={handlePost} disabled={isUploading || isPosting || (!inputs.desc.trim() && !picPath)}><FiSend /> {isPosting ? 'Sharing...' : 'Share post'}</button></div></section></div>}
    </>;
};
export default CreatePostForm;
