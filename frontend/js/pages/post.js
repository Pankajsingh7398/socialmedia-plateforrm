import { api } from '../api.js';
import { renderPostCard, renderComment, renderPostSkeleton } from '../components/postCard.js';
import { showToast } from '../utils.js';

export const renderPostPage = (postId) => `
  <div class="page-container">
    <div id="post-detail">${renderPostSkeleton()}</div>
  </div>
`;

export const loadPost = async (postId) => {
  const container = document.getElementById('post-detail');

  try {
    const [postData, commentsData] = await Promise.all([
      api.get(`/posts/${postId}`),
      api.get(`/comments/post/${postId}`),
    ]);

    const post = postData.post;
    container.innerHTML = renderPostCard(post, { showComments: true });

    const commentsList = document.querySelector(`[data-comments="${postId}"]`);
    if (commentsList) {
      commentsList.innerHTML = commentsData.comments?.length
        ? commentsData.comments.map((c) => renderComment(c, postId)).join('')
        : '<p class="text-muted text-center">No comments yet. Be the first!</p>';
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${err.message || 'Post not found'}</p></div>`;
  }
};

export const bindCommentEvents = (postId) => {
  document.querySelector(`[data-comment-form="${postId}"]`)?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const text = input.value.trim();
    if (!text) return;

    try {
      const data = await api.post(`/comments/post/${postId}`, { text });
      const commentsList = document.querySelector(`[data-comments="${postId}"]`);
      const noComments = commentsList.querySelector('.text-muted');
      if (noComments) noComments.remove();
      commentsList.insertAdjacentHTML('afterbegin', renderComment(data.comment, postId));
      input.value = '';
      showToast('Comment added!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
};

export const addReply = async (postId, parentCommentId, text) => {
  const data = await api.post(`/comments/post/${postId}`, { text, parentCommentId });
  return data.comment;
};
