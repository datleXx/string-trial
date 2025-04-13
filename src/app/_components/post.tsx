"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-white">Latest Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestPost ? (
          <p className="truncate text-white">
            Your most recent post: {latestPost.name}
          </p>
        ) : (
          <p className="text-white">You have no posts yet.</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPost.mutate({ name });
          }}
          className="flex flex-col gap-4"
        >
          <Input
            type="text"
            placeholder="Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/10 text-white placeholder:text-white/70"
          />
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={createPost.isPending}
          >
            {createPost.isPending ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
