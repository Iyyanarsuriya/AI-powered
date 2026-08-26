from pydantic import BaseModel, EmailStr, Field, model_validator



class SignupRequest(BaseModel):

    full_name: str = Field(min_length=2,max_length=100)

    email: EmailStr

    password: str = Field(min_length=8,max_length=100)

    confirm_password: str = Field(min_length=8,max_length=100)

    terms_accepted: bool


    # Check password confirmation and terms
    @model_validator(mode="after")
    def validate_signup(self):

        # Password confirmation
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")

        # Terms and privacy
        if not self.terms_accepted:
            raise ValueError(
                "You must accept the Terms of Service and Privacy Policy"
            )

        return self



class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(min_length=1)

    remember_me: bool = False



class UserResponse(BaseModel):

    id: int

    full_name: str

    email: EmailStr

    model_config = {"from_attributes": True}




class LoginResponse(BaseModel):

    access_token: str

    token_type: str

    expires_in: int

    user: UserResponse