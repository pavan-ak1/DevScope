import bcrypt from "bcryptjs";
import mongoose, {Schema, Document} from "mongoose";


export interface IUser extends Document{
    email:string;
    password:string;
    comparePassword(candidate:string):Promise<boolean>
}

const UserSchema = new Schema<IUser>({
    email:{
         type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
},{timestamps:true});

UserSchema.pre("save", async function(){
    if(!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
})

UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};


export const User = mongoose.model<IUser>("User", UserSchema);




