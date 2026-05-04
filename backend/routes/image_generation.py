"""Image generation routes using OpenAI GPT Image 1."""
import os
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/images", tags=["Image Generation"])

class ImageGenerationRequest(BaseModel):
    prompt: str
    
class ImageGenerationResponse(BaseModel):
    image_base64: str

@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """Generate an image using OpenAI GPT Image 1."""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        image_gen = OpenAIImageGeneration(api_key=api_key)
        
        images = await image_gen.generate_images(
            prompt=request.prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            return {"image_base64": image_base64}
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
            
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Image generation library not available: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
