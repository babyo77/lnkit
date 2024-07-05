import { instagramUser } from "@/app/types/types";
import { createAdminClient } from "@/lib/server/appwrite";
import { getRandom } from "@/lib/utils";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Permission, Query, Role, Users } from "node-appwrite";

export async function POST(req: NextRequest) {
  try {
    const { type, uid, username, sentCode } = await req.json();

    const { db, account, users } = await createAdminClient();
    const code = getRandom();
    if (type === "c") {
      await db.createDocument(
        process.env.DATABASE_ID || "",
        "66878846002499cfeb63",
        uid,
        {
          code: code,
          expired: false,
        }
      );
      await fetch(
        `https://api.telegram.org/bot${
          process.env.TELEGRAM
        }/sendMessage?chat_id=5356614395&text=${encodeURIComponent(
          `${code} to ${username}`
        )}`
      ).catch((err) => {
        console.log(err);
      });
      return NextResponse.json({ status: "success" }, { status: 200 });
    }
    if (type === "v") {
      const DBcode = await db.getDocument(
        process.env.DATABASE_ID || "",
        "66878846002499cfeb63",
        uid,
        [Query.select(["code"])]
      );

      if (DBcode.code === sentCode) {
        await db.deleteDocument(
          process.env.DATABASE_ID || "",
          "66878846002499cfeb63",
          uid
        );
        const data = await fetch(
          `https://gramsnap.com/api/ig/userInfoByUsername/${username}`,
          {
            cache: "no-cache",
          }
        );

        if (!data.ok)
          return NextResponse.json(
            { error: "user not found" },
            { status: 404 }
          );

        const instDetails: { result: { user: instagramUser } } =
          await data.json();
        const result: instagramUser = instDetails.result.user;

        if (!result.pk_id) {
          return NextResponse.json(
            { error: "user not found" },
            { status: 404 }
          );
        }
        const email = result.pk_id + "@circles.com";
        const password = randomUUID();

        if (result.biography.includes(result.biography)) {
          const isAlreadyExist = await users.get(result.pk_id).catch((err) => {
            console.log(err.response.message);
          });
          if (isAlreadyExist) {
            await users.updatePassword(result.pk_id, password);
          } else {
            const data = await db.createDocument(
              process.env.DATABASE_ID || "",
              process.env.USERS_ID || "",
              result.pk_id,
              {
                links:
                  result.bio_links && result.bio_links.length > 0
                    ? [...result.bio_links.map((r) => r.url)]
                    : [`https://instagram.com/${result.username}`],
                fullName: result.full_name ? result.full_name : result.username,
                bio: result.biography ? result.biography.replace(code, "") : "",
                interests: ["Music"],
              },
              [
                Permission.read(Role.user(result.pk_id)),
                Permission.update(Role.user(result.pk_id)),
                Permission.delete(Role.user(result.pk_id)),
              ]
            );
            if (data) {
              await account.create(
                result.pk_id,
                email,
                password,
                result.username
              );
              await updatePrefs(users, result, code);
            }
          }

          const session = await account.createEmailPasswordSession(
            email,
            password
          );
          cookies().set("babyid", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
          });

          return NextResponse.json({ status: "success" }, { status: 200 });
        } else {
          return NextResponse.json({ status: "failed" }, { status: 403 });
        }
      }

      return NextResponse.json({ status: "failed" }, { status: 403 });
    }
  } catch (error) {
    console.log(error);
    await fetch(
      `https://api.telegram.org/bot${
        process.env.TELEGRAM
      }/sendMessage?chat_id=5356614395&text=${encodeURIComponent(
        //@ts-expect-error:expected error
        "OTP Error" + " " + error.message
      )}`
    ).catch((err) => {
      console.log(err);
    });
    return NextResponse.json(
      { error: "something went wrong" },
      { status: 500 }
    );
  }
}

async function updatePrefs(users: Users, result: instagramUser, code: string) {
  users.updatePrefs(result.pk_id, {
    image: await uploadImageFromUrl(
      result.hd_profile_pic_url_info.url,
      result.pk_id
    ),
  });
}

async function uploadImageFromUrl(imageUrl: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();

    if (response.ok) {
      const file = new File([arrayBuffer], fileName, {
        type: response.headers.get("content-type") || "image/jpeg",
      });

      const formData = new FormData();
      formData.append(
        "payload_json",
        JSON.stringify({
          upload_source: "dashboard",
          domain: "the-chiefly-lasagna.tixte.co",
          type: 1,
          name: fileName,
        })
      );
      formData.append("file", file);

      const uploadResponse = await fetch("https://api.tixte.com/v1/upload", {
        method: "POST",
        headers: {
          Authorization: process.env.UPLOAD_AUTH || "",
          "X-Api-Sitekey": process.env.SITE_KEY || "",
          "X-Window-Location": "https://tixte.com/dashboard/browse",
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        console.log("Image uploaded successfully");
        const data: { data: { deletion_url: string; direct_url: string } } =
          await uploadResponse.json();

        return data.data.direct_url;
      } else {
        return imageUrl;
      }
    } else {
      return imageUrl;
    }
  } catch (error) {
    return imageUrl;
  }
}
