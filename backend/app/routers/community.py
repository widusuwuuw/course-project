from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user

router = APIRouter(
    prefix="/community",
    tags=["community"],
)

@router.get("/posts", response_model=List[schemas.PostOut])
def get_posts(
    sort_by: str = 'latest',
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Make current_user required to check for likes
):
    """
    Get all posts, sorted by 'latest' or 'hot', with related data eagerly loaded.
    """
    # Eager load relationships needed for display
    query = db.query(models.Post).options(
        joinedload(models.Post.owner),
        joinedload(models.Post.tags),
        joinedload(models.Post.likes).joinedload(models.Like.owner), # Load the user who liked the post
        joinedload(models.Post.comments)
    )

    if sort_by == 'hot':
        # Sort by number of likes in descending order
        query = query.outerjoin(models.Like).group_by(models.Post.id).order_by(func.count(models.Like.id).desc(), models.Post.created_at.desc())
    else:
        # Default to sorting by latest
        query = query.order_by(models.Post.created_at.desc())
    
    posts = query.all()

    # Manually construct the response to avoid serialization issues
    response_posts = []
    for post in posts:
        is_liked = any(like.owner_id == current_user.id for like in post.likes)
        
        post_out = schemas.PostOut(
            id=post.id,
            content=post.content,
            created_at=post.created_at,
            owner=post.owner,
            image_urls=post.image_urls if post.image_urls else [],
            tags=post.tags,
            likes_count=len(post.likes),
            comments_count=len(post.comments),
            is_liked=is_liked
        )
        response_posts.append(post_out)

    return response_posts

@router.post("/posts", response_model=schemas.PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Create a new post with tags and images.
    """
    new_post = models.Post(
        content=post_data.content,
        image_urls=post_data.image_urls,
        owner_id=current_user.id
    )

    # Handle tags
    tag_objects = []
    for tag_name in post_data.tags:
        tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
        if not tag:
            tag = models.Tag(name=tag_name)
            db.add(tag)
            db.flush() # Flush to get the new tag object with its ID
        tag_objects.append(tag)
    
    new_post.tags = tag_objects

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Manually create the response model
    post_out = schemas.PostOut(
        id=new_post.id,
        content=new_post.content,
        created_at=new_post.created_at,
        owner=new_post.owner,
        image_urls=new_post.image_urls if new_post.image_urls else [],
        tags=new_post.tags,
        likes_count=0,
        comments_count=0,
        is_liked=False
    )
    return post_out

@router.post("/posts/{post_id}/comments", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment_for_post(
    post_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Create a comment for a specific post.
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = models.Comment(
        content=comment.content, owner_id=current_user.id, post_id=post_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.post("/posts/{post_id}/like", status_code=status.HTTP_200_OK)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Like or unlike a post.
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like_query = db.query(models.Like).filter(
        models.Like.post_id == post_id, models.Like.owner_id == current_user.id
    )
    
    found_like = like_query.first()
    if found_like:
        like_query.delete(synchronize_session=False)
        db.commit()
        return {"message": "Post unliked"}
    else:
        new_like = models.Like(owner_id=current_user.id, post_id=post_id)
        db.add(new_like)
        db.commit()
        return {"message": "Post liked"}

@router.get("/posts/{post_id}/comments", response_model=List[schemas.CommentOut])
def get_comments_for_post(post_id: int, db: Session = Depends(get_db)):
    """
    Get all comments for a specific post.
    """
    comments = db.query(models.Comment).filter(models.Comment.post_id == post_id).order_by(models.Comment.created_at.asc()).all()
    return comments
